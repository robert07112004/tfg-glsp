import { GEdge, GModelElement, GNode } from "@eclipse-glsp/server";
import { IDENTIFYING_DEP_RELATION_TYPE, PARTIAL_EXCLUSIVE_SPECIALIZATION_TYPE, PARTIAL_OVERLAPPED_SPECIALIZATION_TYPE, TOTAL_EXCLUSIVE_SPECIALIZATION_TYPE, TOTAL_OVERLAPPED_SPECIALIZATION_TYPE, WEIGHTED_EDGE_TYPE } from "../validation/utils/validation-constants";
import { AttributeTransformer } from "./sql-attribute-transformer";
import { Entity, RelationNodes, SpecializationNodes } from "./sql-interfaces";
import { RelationsTransformer } from "./sql-relations-transformer";
import { SpecializationsTransformer } from "./sql-specializations-transformer";
import { SQLUtils } from "./sql-utils";

export class EntitiesTransformer {

    static processEntity(entity: Entity, relationNodes: RelationNodes, specializationNodes: SpecializationNodes, root: GModelElement): string {
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

        RelationsTransformer.process1NRelation(entity, relationNodes, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);
        RelationsTransformer.processExistenceDependenceRelation("1:N", entity, relationNodes, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);
        const identified = RelationsTransformer.processIdentifyingDependenceRelation("1:N", entity, relationNodes, foreignColumns, pks, relationAttributes, relationRestrictions, foreignKeys, relationMultivalued, root);
        RelationsTransformer.process11Relation(entity, relationNodes, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);
        RelationsTransformer.processExistenceDependenceRelation("1:1", entity, relationNodes, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);
        const isSubclass = SpecializationsTransformer.processSpecialization(entity, specializationNodes, foreignColumns, foreignKeys, inheritedPKNames, specializationRestrictions, root);

        let tableBody: string[] = [];
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
            let cleanPKs = [`    PRIMARY KEY (${pks.join(', ')})`];
            if (identified) {
                simpleAttributes = [];
                AttributeTransformer.transformSimple(entity.node, root).forEach(simple => {
                    const {name, type} = SQLUtils.getNameAndType(simple);
                    if (name.includes("_disc")) {
                        foreignColumns.push(`    ${name} ${type} NOT NULL`);
                        pks.push(name);
                    } else simpleAttributes.push(`    ${name} ${type} NOT NULL`);
                });
            }

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
                simpleAttributes.push(`    tipo_${entity.name} VARCHAR(100) ENUM(${SpecializationsTransformer.getEnum(specNode, root)}, "Otro")`)
                if (!identified) restrictionUnique.push(`    UNIQUE (${pksFromParent.join(", ")}, tipo_${entity.name})`);
                else restrictionUnique.push(`    UNIQUE (${pks.join(", ")}, tipo_${entity.name})`);
            } else if (specNode.type === TOTAL_EXCLUSIVE_SPECIALIZATION_TYPE) {
                simpleAttributes.push(`    tipo_${entity.name} VARCAHR(100) ENUM(${SpecializationsTransformer.getEnum(specNode, root)}) NOT NULL`);
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
                ...(restrictionPks || cleanPKs || []),          
                ...(restrictionUnique || []),       
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

        return sql;
    }

    static getFatherPKsFromWeakEntity(entity: GNode, root: GModelElement): GNode[] {
        let fatherPKs: GNode[] = [];
        const getEdge = root.children.find(child => child instanceof GEdge && child.type === WEIGHTED_EDGE_TYPE && child.sourceId === entity.id) as GEdge;
        const getIdentifyingRelation = SQLUtils.findById(getEdge.targetId, root) as GNode;
        if (getIdentifyingRelation && getIdentifyingRelation.type === IDENTIFYING_DEP_RELATION_TYPE) {
            const getEdgeOfNormalEntity = root.children.find(child => child instanceof GEdge && child.type === WEIGHTED_EDGE_TYPE && child.targetId === getIdentifyingRelation.id) as GEdge;
            const getNormalEntity = SQLUtils.findById(getEdgeOfNormalEntity.sourceId, root) as GNode;
            if (getNormalEntity) {
                fatherPKs = AttributeTransformer.transformPKs(getNormalEntity, root);
            }
        }
        return fatherPKs;
    }
}