import { GEdge, GModelElement, GNode } from "@eclipse-glsp/server";
import { IDENTIFYING_DEP_RELATION_TYPE, PARTIAL_EXCLUSIVE_SPECIALIZATION_TYPE, PARTIAL_OVERLAPPED_SPECIALIZATION_TYPE, TOTAL_EXCLUSIVE_SPECIALIZATION_TYPE, TOTAL_OVERLAPPED_SPECIALIZATION_TYPE, WEIGHTED_EDGE_TYPE } from "../validation/utils/validation-constants";
import { AttributeTransformer } from "./sql-attribute-transformer";
import { Entity, GeneratedTable, RelationNodes, SpecializationNodes } from "./sql-interfaces";
import { RelationsTransformer } from "./sql-relations-transformer";
import { SpecializationsTransformer } from "./sql-specializations-transformer";
import { SQLUtils } from "./sql-utils";

export class EntitiesTransformer {

    static processEntity(entity: Entity, relationNodes: RelationNodes, specializationNodes: SpecializationNodes, root: GModelElement): GeneratedTable {
        const dependencies = new Set<string>();
        
        let sql = `CREATE TABLE ${entity.name} (\n`;
        
        let { columnPKs, restriction: restrictionPks } = AttributeTransformer.processPK(entity.attributes.pk);
        const { columns: uniqueColumns, restriction: restrictionUnique } = AttributeTransformer.processUnique(entity.attributes.unique);
        let simpleAttributes = AttributeTransformer.processSimpleAttributes(entity.attributes.simple);
        const optionalAttributes = AttributeTransformer.processOptionalAttributes(entity.attributes.optional);
        
        const foreignColumns: string[] = [];
        const foreignKeys: string[] = [];
        const relationAttributes: string[] = [];
        const relationRestrictions: string[] = [];
        const relationMultivalued: string[] = [];
        const pks: string[] = [];
        let inheritedPKNames: string[] = [];
        const specializationRestrictions: string[] = [];

        const depsIdent = RelationsTransformer.processIdentifyingDependenceRelation("1:N", entity, relationNodes, foreignColumns, pks, relationAttributes, relationRestrictions, foreignKeys, relationMultivalued, root);
        const deps1NExist = RelationsTransformer.processExistenceDependenceRelation("1:N", entity, relationNodes, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);
        const deps11Exist = RelationsTransformer.processExistenceDependenceRelation("1:1", entity, relationNodes, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);
        const deps1N = RelationsTransformer.process1NRelation(entity, relationNodes, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);
        const deps11 = RelationsTransformer.process11Relation(entity, relationNodes, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);
        const depsSpec = SpecializationsTransformer.processSpecialization(entity, specializationNodes, foreignColumns, foreignKeys, inheritedPKNames, specializationRestrictions, root);

        [deps1N, deps1NExist, depsIdent, deps11, deps11Exist, depsSpec].forEach(depSet => {
            depSet.forEach(d => dependencies.add(d));
        });

        let tableBody: string[] = [];

        const isSubclass = depsSpec.size > 0;

        if (isSubclass) {
            let finalPK: string[] = [];
            if (inheritedPKNames.length > 1) { finalPK = [`    PRIMARY KEY (${inheritedPKNames.join(', ')})`]; } 
            tableBody = [
                ...foreignColumns,      
                ...uniqueColumns,
                ...simpleAttributes,
                ...optionalAttributes,
                ...relationAttributes,
                ...finalPK,             
                ...(restrictionUnique || []),
                ...relationRestrictions,
                ...specializationRestrictions,
                ...foreignKeys          
            ];
        } else {
            let cleanPKs: string[] = [];
            const identified = depsIdent.size > 0 
            if (identified) cleanPKs = [`    PRIMARY KEY (${pks.join(", ")})`];

            let specNode: GNode = new GNode;
            for (const spec of specializationNodes.values()) {
                const asFather = spec.father.node.id === entity.node.id;
                if (asFather) {
                    specNode = spec.node; 
                    break;
                }
            }

            let pksFromParent: string[] = [];
            if (!identified) {
                AttributeTransformer.transformPKs(entity.node, root).forEach(pk => {
                    const {name, type: _} = SQLUtils.getNameAndType(pk);
                    pksFromParent.push(name);
                });
            }

            if (specNode.type === PARTIAL_EXCLUSIVE_SPECIALIZATION_TYPE) {
                simpleAttributes.push(`    tipo_${entity.name} ENUM(${SpecializationsTransformer.getEnum(specNode, root)}, 'Otro')`)
                if (!identified) restrictionUnique.push(`    UNIQUE (${pksFromParent.join(", ")}, tipo_${entity.name})`);
                else restrictionUnique.push(`    UNIQUE (${pks.join(", ")}, tipo_${entity.name})`);
            } else if (specNode.type === TOTAL_EXCLUSIVE_SPECIALIZATION_TYPE) {
                simpleAttributes.push(`    tipo_${entity.name} ENUM(${SpecializationsTransformer.getEnum(specNode, root)}) NOT NULL`);
                if (!identified) restrictionUnique.push(`    UNIQUE (${pksFromParent.join(", ")}, tipo_${entity.name})`);
                else restrictionUnique.push(`    UNIQUE (${pks.join(", ")}, tipo_${entity.name})`);
            } else if (specNode.type === PARTIAL_OVERLAPPED_SPECIALIZATION_TYPE) {
                SpecializationsTransformer.getEnum(specNode, root).split(',').map(p => p.replace(/'/g, "").trim()).forEach(child => {
                    simpleAttributes.push(`    es_${child} BOOLEAN DEFAULT FALSE NOT NULL`);
                    if (!identified) restrictionUnique.push(`    UNIQUE (${pksFromParent.join(", ")}, es_${child})`);
                    else restrictionUnique.push(`    UNIQUE (${pks.join(", ")}, es_${child})`)
                });
            } else if (specNode.type === TOTAL_OVERLAPPED_SPECIALIZATION_TYPE) {
                const childNames = SpecializationsTransformer.getEnum(specNode, root)
                    .split(',')
                    .map(p => p.replace(/'/g, "").trim());

                childNames.forEach(child => {
                    simpleAttributes.push(`    es_${child} BOOLEAN DEFAULT FALSE NOT NULL`);
                    if (!identified) restrictionUnique.push(`    UNIQUE (${pksFromParent.join(", ")}, es_${child})`);
                    else restrictionUnique.push(`    UNIQUE (${pks.join(", ")}, es_${child})`)
                });

                if (childNames.length > 0) {
                    const orConditions = childNames
                        .map(child => `es_${child} = TRUE`)
                        .join(" OR ");    
                    specializationRestrictions.push(`    CHECK (${orConditions})`);
                }
            }

            tableBody = [
                ...columnPKs,                       
                ...uniqueColumns,                   
                ...simpleAttributes,                
                ...optionalAttributes,              
                ...foreignColumns,                  
                ...relationAttributes,      
                ...restrictionPks,
                ...cleanPKs,                  
                ...restrictionUnique,       
                ...relationRestrictions,   
                ...specializationRestrictions,         
                ...foreignKeys                      
            ];
        }
        
        sql += tableBody.join(",\n");
        sql += "\n);\n\n";

        const entityMultivalued = AttributeTransformer.processMultivaluedAttributes(entity.attributes.multiValued, entity.node, root);

        sql += entityMultivalued.join("\n");
        sql += relationMultivalued.join("\n");

        const results: GeneratedTable = {
            name: entity.name,
            sql: sql,
            dependencies: Array.from(dependencies)
        };

        return results;
    }

    static getFatherPKsFromWeakEntity(entity: GNode, root: GModelElement): GNode[] {
        let fatherPKs: GNode[] = [];

        // 1. Buscamos la ARISTA que conecta nuestra entidad débil con la relación identificativa
        const edgesFromWeak = root.children.filter(child => 
            child instanceof GEdge && 
            child.type === WEIGHTED_EDGE_TYPE && 
            child.sourceId === entity.id
        ) as GEdge[];

        const identifyingEdge = edgesFromWeak.find(edge => {
            const targetNode = SQLUtils.findById(edge.targetId, root);
            return targetNode?.type === IDENTIFYING_DEP_RELATION_TYPE;
        });

        // Si encontramos la arista, significa que tenemos el ID de la relación (identifyingEdge.targetId)
        if (identifyingEdge) {
            const relationId = identifyingEdge.targetId;

            // 2. Buscamos la OTRA arista que llega a esa misma relación desde la entidad fuerte
            const strongEdge = root.children.find(child => 
                child instanceof GEdge && 
                child.type === WEIGHTED_EDGE_TYPE && 
                child.targetId === relationId && 
                child.sourceId !== entity.id // Importante: que no sea la que ya tenemos
            ) as GEdge | undefined;

            // 3. Si encontramos la arista fuerte, sacamos su sourceId (el ID de la Entidad Fuerte)
            if (strongEdge) {
                const strongEntity = SQLUtils.findById(strongEdge.sourceId, root) as GNode;
                if (strongEntity) {
                    // Obtenemos las PKs de la entidad padre
                    fatherPKs = AttributeTransformer.transformPKs(strongEntity, root);
                }
            }
        }

        return fatherPKs;
    }
}