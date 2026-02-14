import { GEdge, GModelElement, GNode } from "@eclipse-glsp/server";
import { ENTITY_TYPE, EXISTENCE_DEP_RELATION_TYPE, RELATION_TYPE, WEAK_ENTITY_TYPE } from "../validation/utils/validation-constants";
import { AttributeTransformer } from "./sql-attribute-transformer";
import { Entity, Relation, RelationNodes } from "./sql-interfaces";
import { SQLUtils } from "./sql-utils";

export class RelationsTransformer {

    // FKs se suelen poner como UNIQUE
    static processRelationNM(relation: Relation, root: GModelElement): string {
        let sql = `CREATE TABLE ${relation.name} (\n`;
        let tableLines: string[] = [];
        let pkColumns: string[] = [];
        let fkColumns: string[] = [];
        
        const colNameMapping: { node: GNode, tableName: string, colName: string }[] = [];
        const { columnPKs, restriction: relPkRest } = AttributeTransformer.processPK(relation.attributes.pk);
        const { columns: uniqueColumns, restriction: relUniqueRest } = AttributeTransformer.processUnique(relation.attributes.unique);

        if (relation.attributes.pk.length > 0) {
            relation.attributes.pk.forEach(pkNode => {
                const { name } = SQLUtils.getNameAndType(pkNode);
                colNameMapping.push({ node: pkNode, tableName: relation.name, colName: name });
            });
        }

        if (columnPKs.length > 0) tableLines.push(...columnPKs);
        const isReflexive = this.isReflexive(relation.node, root);
        
        relation.connectedEntities.forEach((conn, index) => {
            const entityName = SQLUtils.cleanNames(conn.entity);
            const entityPkNodes = AttributeTransformer.transformPKs(conn.entity, root);
            entityPkNodes.forEach(pkNode => {
                const { name, type } = SQLUtils.getNameAndType(pkNode);
                const colName = isReflexive ? `${name}_${index + 1}` : name;
                tableLines.push(`    ${colName} ${type} NOT NULL`);
                if (relation.attributes.pk.length === 0) {
                    pkColumns.push(colName);
                    colNameMapping.push({ node: pkNode, tableName: SQLUtils.cleanNames(conn.entity), colName: colName });
                }
                if (relation.type === RELATION_TYPE) fkColumns.push(`    FOREIGN KEY (${colName}) REFERENCES ${entityName}(${name})`);
                else if (relation.type === EXISTENCE_DEP_RELATION_TYPE) fkColumns.push(`    FOREIGN KEY (${colName}) REFERENCES ${entityName}(${name}) ON DELETE CASCADE`);
            });
        });

        tableLines.push(...uniqueColumns, ...AttributeTransformer.processSimpleAttributes(relation.attributes.simple), ...AttributeTransformer.processOptionalAttributes(relation.attributes.optional));    
        
        if (relation.attributes.pk.length === 0 && pkColumns.length > 0) tableLines.push(`    PRIMARY KEY (${pkColumns.join(', ')})`);
        else if (relPkRest.length > 0) tableLines.push(...relPkRest);
    
        if (relUniqueRest.length > 0) tableLines.push(...relUniqueRest);
        
        tableLines.push(...fkColumns);
        sql += tableLines.join(",\n") + "\n);\n\n";
        
        relation.attributes.multiValued.forEach(mv => {
            mv.parentPKs = colNameMapping;
            mv.parentName = relation.name; 
        });
        
        const multivalued = AttributeTransformer.processMultivaluedAttributes(relation.attributes.multiValued, relation.node, root);
        return sql + multivalued.join("\n");
    }
       
    static isReflexive(relation: GNode, root: GModelElement): boolean {
        const uniqueEntities = new Set<string>();
        const edges = root.children.filter(child => child instanceof GEdge && child.targetId === relation.id) as GEdge[];
        for (const edge of edges) uniqueEntities.add(edge.sourceId);
        return uniqueEntities.size === 1 && edges.length > 1;
    }

    static getConnectedEntities(relation: GNode, root: GModelElement): { cardinalityText: string, entity: GNode }[] {
        const connectedEntities: { cardinalityText: string, entity: GNode }[] = [];
        const edges = root.children.filter(child => child instanceof GEdge && child.targetId === relation.id) as GEdge[];
        for (const edge of edges) {
            const object: { cardinalityText: string, entity: GNode } = { cardinalityText: SQLUtils.getCardinality(edge), entity: SQLUtils.findById(edge.sourceId, root) as GNode };
            connectedEntities.push(object);
        }
        return connectedEntities;
    }

    static process1NRelation(entity: Entity, relationNodes: RelationNodes, foreignColumns: string[], foreignKeys: string[], relationAttributes: string[], relationRestrictions: string[], relationMultivalued: string[], root: GModelElement) {
        for (const relation of relationNodes.values()) {
            const is1N = relation.cardinality.includes("1:N") && relation.type === RELATION_TYPE;    
            if (is1N) {
                const sideN = relation.connectedEntities.find(ce => ce.cardinalityText.toUpperCase().includes("N"));
                const side1 = relation.connectedEntities.find(ce => ce.cardinalityText.includes("1") && !ce.cardinalityText.toUpperCase().includes("N"));

                if (sideN && sideN.entity.id === entity.node.id && side1) {
                    this.absorbRelation(relation, side1.entity, sideN.cardinalityText, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);
                }
            }
        }
    }

    static process11Relation(entity: Entity, relationNodes: RelationNodes, foreignColumns: string[], foreignKeys: string[], relationAttributes: string[], relationRestrictions: string[], relationMultivalued: string[], root: GModelElement) {
        for (const relation of relationNodes.values()) {
            const is11 = relation.cardinality.includes("1:1") && relation.type === RELATION_TYPE;    
            if (is11) {
                const edgeA = relation.connectedEntities[0].cardinalityText;
                const edgeB = relation.connectedEntities[1].cardinalityText;

                const entityA = relation.connectedEntities[0].entity;
                const entityB = relation.connectedEntities[1].entity;

                const isAOptional = relation.connectedEntities[0].cardinalityText.includes("0");
                const isBOptional = relation.connectedEntities[1].cardinalityText.includes("0");

                let selectedEntity: GNode;
                let otherEntity: GNode;
                let participationOfSelected: string;

                if (!isAOptional && isBOptional) {
                    selectedEntity = entityA;
                    otherEntity = entityB;
                    participationOfSelected = edgeA;
                } else if (isAOptional && !isBOptional) {
                    selectedEntity = entityB;
                    otherEntity = entityA;
                    participationOfSelected = edgeB;
                } else {
                    if (entityA.id < entityB.id) {
                        selectedEntity = entityA;
                        otherEntity = entityB;
                        participationOfSelected = edgeA;
                    } else {
                        selectedEntity = entityB;
                        otherEntity = entityA;
                        participationOfSelected = edgeB;
                    }
                }

                if (selectedEntity.id === entity.node.id) {
                    this.absorbRelation(relation, otherEntity, participationOfSelected, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);
                }
            }
        }
    }

    static processExistenceDependenceRelation(cardinality: string, entity: Entity, relationNodes: RelationNodes, foreignColumns: string[], foreignKeys: string[], relationAttributes: string[], relationRestrictions: string[], relationMultivalued: string[], root: GModelElement) {
        for (const relation of relationNodes.values()) {
            const isExistence = relation.cardinality.includes(cardinality) && relation.type === EXISTENCE_DEP_RELATION_TYPE;    
            if (isExistence) {
                let sideNormal: { cardinalityText: string, entity: GNode } | undefined;
                let sideWeak: { cardinalityText: string, entity: GNode } | undefined;

                if (relation.isReflexive) {
                    sideNormal = relation.connectedEntities[0];
                    sideWeak = relation.connectedEntities[1];
                } else {
                    sideNormal = relation.connectedEntities.find(ce => ce.entity.type === ENTITY_TYPE);
                    sideWeak = relation.connectedEntities.find(ce => ce.entity.type === WEAK_ENTITY_TYPE);
                }
                
                if (sideWeak && sideNormal && sideWeak.entity.id === entity.node.id) {
                    this.absorbRelation(relation, sideNormal.entity, sideNormal.cardinalityText, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);
                }
            }
        }
    }

    private static absorbRelation(relation: Relation, sourceEntity: GNode, participation: string, foreignColumns: string[], foreignKeys: string[], relationAttributes: string[], relationRestrictions: string[], relationMultivalued: string[], root: GModelElement) {
        const sourceName = SQLUtils.cleanNames(sourceEntity);
        const fkNodes = AttributeTransformer.transformPKs(sourceEntity, root);
        
        fkNodes.forEach(pkNode => {
            const { name, type } = SQLUtils.getNameAndType(pkNode);
            const colName = relation.isReflexive ? `${relation.name}_${name}` : name;
            
            const uniqueConstraint = !relation.cardinality.includes("N") ? "UNIQUE" : "";
            let nullability = "";
            if (relation.type === EXISTENCE_DEP_RELATION_TYPE) nullability = "NOT NULL";
            else nullability =  participation.includes("0") ? "NULL" : "NOT NULL";

            foreignColumns.push(`    ${colName} ${type} ${nullability} ${uniqueConstraint}`);
            if (relation.type === RELATION_TYPE) foreignKeys.push(`    FOREIGN KEY (${colName}) REFERENCES ${sourceName}(${name})`);
            else if (relation.type === EXISTENCE_DEP_RELATION_TYPE) foreignKeys.push(`    FOREIGN KEY (${colName}) REFERENCES ${sourceName}(${name}) ON DELETE CASCADE`);
        });

        const relSimple = AttributeTransformer.processSimpleAttributes(relation.attributes.simple);
        const relOptional = AttributeTransformer.processOptionalAttributes(relation.attributes.optional);
        const { columns: relUniqueCols, restriction: relUniqueRest } = AttributeTransformer.processUnique(relation.attributes.unique);
        const { columnPKs: relPkCols, restriction: relPkRest } = AttributeTransformer.processPK(relation.attributes.pk);

        const cleanedRelPkCols = relPkCols.map(col => col.replace(" PRIMARY KEY", " UNIQUE"));
        const cleanedRelPkRest = relPkRest.map(rel => rel.replace("PRIMARY KEY", "UNIQUE"));

        relationAttributes.push(...cleanedRelPkCols, ...relUniqueCols, ...relSimple, ...relOptional);
        if (cleanedRelPkRest) relationRestrictions.push(...cleanedRelPkRest);
        if (relUniqueRest) relationRestrictions.push(...relUniqueRest);

        relationMultivalued.push(...AttributeTransformer.processMultivaluedAttributes(relation.attributes.multiValued, relation.node, root));
    }

}