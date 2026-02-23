import { GEdge, GModelElement, GNode } from "@eclipse-glsp/server";
import { IDENTIFYING_DEP_RELATION_TYPE, PARTIAL_EXCLUSIVE_SPECIALIZATION_TYPE, PARTIAL_OVERLAPPED_SPECIALIZATION_TYPE, TOTAL_EXCLUSIVE_SPECIALIZATION_TYPE, TOTAL_OVERLAPPED_SPECIALIZATION_TYPE, WEIGHTED_EDGE_TYPE } from "../validation/utils/validation-constants";
import { AttributeTransformer } from "./sql-attribute-transformer";
import { Entity, GeneratedTable, RelationNodes, SpecializationNodes } from "./sql-interfaces";
import { RelationsTransformer } from "./sql-relations-transformer";
import { SpecializationsTransformer } from "./sql-specializations-transformer";
import { SQLUtils } from "./sql-utils";

export class EntitiesTransformer {

    /**
     * Transforma una entidad del modelo en una definición de tabla SQL completa.
     * @param entity La entidad que se va a procesar.
     * @param relationNodes Mapa de todas las relaciones del diagrama.
     * @param specializationNodes Mapa de todas las jerarquías de especialización.
     * @param root Elemento raíz del modelo (GModel).
     * @returns Un objeto con el nombre de la tabla, su SQL y sus dependencias.
     */
    static processEntity(entity: Entity, relationNodes: RelationNodes, specializationNodes: SpecializationNodes, root: GModelElement): GeneratedTable {
        const dependencies = new Set<string>();
        
        // Procesar Atributos base de la entidad
        const { columnPKs, restriction: restrictionPks } = AttributeTransformer.processPK(entity.attributes.pk);
        const { columns: uniqueColumns, restriction: restrictionUnique } = AttributeTransformer.processUnique(entity.attributes.unique);
        const simpleAttributes = AttributeTransformer.processSimpleAttributes(entity.attributes.simple);
        const optionalAttributes = AttributeTransformer.processOptionalAttributes(entity.attributes.optional);

        // Inicializar contenedores para elementos absorbidos de relaciones y jerarquías
        const absorbed = {
            foreignColumns: [] as string[],
            foreignKeys: [] as string[],
            relationAttributes: [] as string[],
            relationRestrictions: [] as string[],
            relationMultivalued: [] as string[],
            pks: [] as string[],                        // PKs cuando la entidad es débil
            inheritedPKNames: [] as string[],           // PKs heredadas de un padre (subclases)
            specRestrictions: [] as string[]
        };

        // Procesar todas las relaciones y especializaciones donde participa la entidad
        this.processStructuralDependencies(entity, relationNodes, specializationNodes, absorbed, dependencies, root);

        let tableBody: string[] = [];
        const isSubclass = absorbed.inheritedPKNames.length > 0;

        if (isSubclass) {                                       // CASO A: La entidad es una SUBCLASE (Hija en una especialización)
            tableBody = this.buildSubclassTableBody(
                absorbed, uniqueColumns, simpleAttributes, optionalAttributes, restrictionUnique
            );
        } else {                                                // CASO B: La entidad es BASE (Puede ser padre o estar sola)
            // Si la entidad es padre en una jerarquía, añadimos discriminadores (Enums/Booleans)
            this.handleFatherSpecializationLogic(entity, specializationNodes, simpleAttributes, restrictionUnique, absorbed, root);

            tableBody = this.buildBaseTableBody(
                columnPKs, uniqueColumns, simpleAttributes, optionalAttributes, 
                restrictionPks, restrictionUnique, absorbed
            );
        }

        // Construir SQL final
        let sql = `CREATE TABLE ${entity.name} (\n`;
        sql += tableBody.join(",\n");
        sql += "\n);\n\n";

        // Añadir SQL de atributos multivaluados (tanto de la entidad como de relaciones absorbidas)
        const entityMultivalued = AttributeTransformer.processMultivaluedAttributes(entity.attributes.multiValued, entity.node, root);
        sql += entityMultivalued.join("\n") + absorbed.relationMultivalued.join("\n");

        return {
            name: entity.name,
            sql: sql,
            dependencies: Array.from(dependencies)
        };
    }

    /**
     * Ejecuta los transformadores de relaciones y especializaciones para recolectar columnas y dependencias.
     */
    private static processStructuralDependencies(entity: Entity, relationNodes: RelationNodes, specializationNodes: SpecializationNodes, 
                                                 abs: any, deps: Set<string>, root: GModelElement
    ) {
        const d1 = RelationsTransformer.processIdentifyingDependenceRelation("1:N", entity, relationNodes, abs.foreignColumns, abs.pks, abs.relationAttributes, abs.relationRestrictions, abs.foreignKeys, abs.relationMultivalued, root);
        const d2 = RelationsTransformer.processExistenceDependenceRelation("1:N", entity, relationNodes, abs.foreignColumns, abs.foreignKeys, abs.relationAttributes, abs.relationRestrictions, abs.relationMultivalued, root);
        const d3 = RelationsTransformer.processExistenceDependenceRelation("1:1", entity, relationNodes, abs.foreignColumns, abs.foreignKeys, abs.relationAttributes, abs.relationRestrictions, abs.relationMultivalued, root);
        const d4 = RelationsTransformer.process1NRelation(entity, relationNodes, abs.foreignColumns, abs.foreignKeys, abs.relationAttributes, abs.relationRestrictions, abs.relationMultivalued, root);
        const d5 = RelationsTransformer.process11Relation(entity, relationNodes, abs.foreignColumns, abs.foreignKeys, abs.relationAttributes, abs.relationRestrictions, abs.relationMultivalued, root);
        const d6 = SpecializationsTransformer.processSpecialization(entity, specializationNodes, abs.foreignColumns, abs.foreignKeys, abs.inheritedPKNames, abs.specRestrictions, root);

        [d1, d2, d3, d4, d5, d6].forEach(set => set.forEach(d => deps.add(d)));
    }

    /**
     * Construye el cuerpo de la tabla para una entidad base o fuerte.
     */
    private static buildBaseTableBody(columnPKs: string[], uniqueCols: string[], simpleAttrs: string[], optionalAttrs: string[], restPKs: string[], restUnique: string[], abs: any): string[] {
        const cleanPKs = abs.pks.length > 0 ? [`    PRIMARY KEY (${abs.pks.join(", ")})`] : [];
        return [
            ...columnPKs, ...uniqueCols, ...simpleAttrs, ...optionalAttrs, ...abs.foreignColumns,
            ...abs.relationAttributes, ...restPKs, ...cleanPKs, ...restUnique,
            ...abs.relationRestrictions, ...abs.specRestrictions, ...abs.foreignKeys
        ];
    }

    /**
     * Si la entidad es padre en una especialización, genera las columnas discriminadoras.
     */
    private static handleFatherSpecializationLogic(
        entity: Entity, specializationNodes: SpecializationNodes, 
        simpleAttributes: string[], restrictionUnique: string[], abs: any, root: GModelElement
    ) {
        // Buscamos si esta entidad es padre de alguna especialización
        const spec = Array.from(specializationNodes.values()).find(s => s.father.node.id === entity.node.id);
        if (!spec) return;

        const specNode = spec.node;
        const identified = abs.pks.length > 0;
        
        // Obtenemos nombres de PKs para las restricciones UNIQUE compuestas
        const pkNames = identified ? abs.pks : AttributeTransformer.transformPKs(entity.node, root).map(pk => SQLUtils.getNameAndType(pk).name);
        const enumValues = SpecializationsTransformer.getEnum(specNode, root);

        switch (specNode.type) {
            case PARTIAL_EXCLUSIVE_SPECIALIZATION_TYPE:
                simpleAttributes.push(`    tipo_${entity.name} ENUM(${enumValues}, 'Otro')`);
                restrictionUnique.push(`    UNIQUE (${pkNames.join(", ")}, tipo_${entity.name})`);
                break;

            case TOTAL_EXCLUSIVE_SPECIALIZATION_TYPE:
                simpleAttributes.push(`    tipo_${entity.name} ENUM(${enumValues}) NOT NULL`);
                restrictionUnique.push(`    UNIQUE (${pkNames.join(", ")}, tipo_${entity.name})`);
                break;

            case TOTAL_OVERLAPPED_SPECIALIZATION_TYPE || PARTIAL_OVERLAPPED_SPECIALIZATION_TYPE:
                const children = enumValues.split(',').map(p => p.replace(/'/g, "").trim());
                children.forEach(child => {
                    simpleAttributes.push(`    es_${child} BOOLEAN DEFAULT FALSE NOT NULL`);
                    restrictionUnique.push(`    UNIQUE (${pkNames.join(", ")}, es_${child})`);
                });

                if (specNode.type === TOTAL_OVERLAPPED_SPECIALIZATION_TYPE && children.length > 0) {
                    const orConditions = children.map(c => `es_${c} = TRUE`).join(" OR ");
                    abs.specRestrictions.push(`    CHECK (${orConditions})`);
                }
                break;
        }
    }

    /**
     * Construye el cuerpo de la tabla para una subclase.
     */
    private static buildSubclassTableBody(abs: any, uniques: string[], simples: string[], optionals: string[], restUnique: string[]): string[] {
        const pkLine = abs.inheritedPKNames.length > 1 ? [`    PRIMARY KEY (${abs.inheritedPKNames.join(', ')})`] : [];
        return [
            ...abs.foreignColumns, ...uniques, ...simples, ...optionals, ...abs.relationAttributes,
            ...pkLine, ...restUnique, ...abs.relationRestrictions, ...abs.specRestrictions, ...abs.foreignKeys
        ];
    }

    static getFatherPKsFromWeakEntity(entity: GNode, root: GModelElement): { name: string, pks: GNode[]} {
        let fatherPKs: GNode[] = [];

        // Buscamos la ARISTA que conecta nuestra entidad débil con la relación identificativa
        const edgesFromWeak = root.children.filter(child => child instanceof GEdge && child.type === WEIGHTED_EDGE_TYPE && child.sourceId === entity.id) as GEdge[];

        const identifyingEdge = edgesFromWeak.find(edge => {
            const targetNode = SQLUtils.findById(edge.targetId, root);
            return targetNode?.type === IDENTIFYING_DEP_RELATION_TYPE;
        });

        let relationNodeName = "";

        // Si encontramos la arista, significa que tenemos el ID de la relación (identifyingEdge.targetId)
        if (identifyingEdge) {
            const relationId = identifyingEdge.targetId;
            const relationNode = SQLUtils.findById(relationId, root) as GNode;
            relationNodeName = SQLUtils.cleanNames(relationNode);

            // Buscamos la OTRA arista que llega a esa misma relación desde la entidad fuerte
            const strongEdge = root.children.find(child => 
                child instanceof GEdge && 
                child.type === WEIGHTED_EDGE_TYPE && 
                child.targetId === relationId && 
                child.sourceId !== entity.id // Importante: que no sea la que ya tenemos
            ) as GEdge | undefined;

            // Si encontramos la arista fuerte, sacamos su sourceId (el ID de la Entidad Fuerte)
            if (strongEdge) {
                const strongEntity = SQLUtils.findById(strongEdge.sourceId, root) as GNode;
                if (strongEntity) {
                    // Obtenemos las PKs de la entidad padre
                    fatherPKs = AttributeTransformer.transformPKs(strongEntity, root);
                }
            }
        }

        return {name: relationNodeName, pks: fatherPKs};
    }
    
}