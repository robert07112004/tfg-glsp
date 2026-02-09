import { GEdge, GModelElement, GNode } from "@eclipse-glsp/server";
import { RELATION_TYPE } from "../validation/utils/validation-constants";
import { AttributeTransformer } from "./sql-attribute-transformer";
import { NodeData, NodeRegistry } from "./sql-interfaces";
import { SQLUtils } from "./sql-utils";

export class RelationsTransformer {

    static processNMrelation(relationData: NodeData, connectedEntities: NodeData[], root: GModelElement) {
        const columns: string[] = [];
        const entityPKCols: string[] = [];
        const pkNodes: GNode[] = [];
        const relationPKCols: string[] = [];
        const tableConstraints: string[] = [];
        const foreignKeys: string[] = [];

        connectedEntities.forEach(entity => {
            entity.attributes.pk.flat().forEach(pkNode => {
                const { name, type } = SQLUtils.getNameAndType(pkNode);
                const columnName = `${entity.name}_${name}`;
                columns.push(`    ${columnName} ${type} NOT NULL`);
                entityPKCols.push(columnName);
                foreignKeys.push(`FOREIGN KEY (${columnName}) REFERENCES ${entity.name}(${name})`);
                pkNodes.push(pkNode);
            });
        });

        relationData.attributes.pk.flat().forEach(pkNode => {
            const { name, type } = SQLUtils.getNameAndType(pkNode);
            columns.push(`    ${name} ${type} NOT NULL`);
            relationPKCols.push(name);
        });

        const compositeUnique: string[] = [];
        AttributeTransformer.transformUnique(relationData, columns, compositeUnique, root);
        AttributeTransformer.transformSimple(relationData, columns, root);
        AttributeTransformer.transformOptionals(relationData, columns);

        let sql = `CREATE TABLE ${relationData.name} (\n`;
        sql += columns.join(",\n");
        
        if (relationPKCols.length > 0) {
            tableConstraints.push(`PRIMARY KEY (${relationPKCols.join(", ")})`);
            if (entityPKCols.length > 0) tableConstraints.push(`UNIQUE (${entityPKCols.join(", ")})`);
        } else if (entityPKCols.length > 0) {
            tableConstraints.push(`PRIMARY KEY (${entityPKCols.join(", ")})`);
        }

        tableConstraints.push(...compositeUnique, ...foreignKeys);

        sql += SQLUtils.buildTable(relationData.name, columns, tableConstraints)
        
        relationData.attributes.multiValued.forEach(mv => {
            if (relationPKCols.length > 0) sql += AttributeTransformer.processMultivalued(relationData.name + "_" + mv.name, relationData.attributes.pk.flat(), mv, root);
            else sql += AttributeTransformer.processMultivalued(relationData.name + "_" + mv.name, pkNodes, mv, root);
        });

        return sql;
    }

    static processBinary11Relation(entityData: NodeData, columns: string[], compositeUnique: string[], tableConstraints: string[], root: GModelElement, nodeRegistry: NodeRegistry): string {
        let multivaluedRelation = "";
        const edgeToRelations = root.children.filter(edge => edge instanceof GEdge && edge.sourceId === entityData.node.id) as GEdge[];

        edgeToRelations.forEach(edge => {
            const relationNode = SQLUtils.findById(edge.targetId, root);
            if (relationNode?.type !== RELATION_TYPE) return;

            const myCardinality = SQLUtils.getCardinality(edge);
            const relationEdges = root.children.filter(e => e instanceof GEdge && e.targetId === relationNode.id && e.sourceId !== entityData.node.id) as GEdge[];
            
            const otherEdge = relationEdges[0];
            if (!otherEdge) return;

            const otherCardinality = SQLUtils.getCardinality(otherEdge);
            const entityOther = nodeRegistry.get(otherEdge.sourceId);
            if (!entityOther) return;

            let shouldReceiveFK = false;
            let isNotNull = false;

            const isMandatorySelf = myCardinality.includes("1..1");
            const isMandatoryOther = otherCardinality.includes("1..1");
            const is11 = !myCardinality.includes("N") && !otherCardinality.includes("N");

            if (is11) {
                // Caso A: Mandatorio (Yo) - Opcional (Él) -> Yo recibo la FK (NOT NULL)
                if (isMandatorySelf && !isMandatoryOther) {
                    shouldReceiveFK = true;
                    isNotNull = true;
                }
                // Caso B: Ambos Opcionales -> Desempate por ID para que solo uno reciba la FK (NULL)
                else if (!isMandatorySelf && !isMandatoryOther) {
                    if (entityData.node.id < entityOther.node.id) {
                        shouldReceiveFK = true;
                        isNotNull = false;
                    }
                }
            }

            if (shouldReceiveFK) {
                const fkColNames: string[] = [];
                const refPkNames: string[] = [];
                const isComposite = entityOther.attributes.pk.flat().length > 1;

                entityOther.attributes.pk.flat().forEach(pkNode => {
                    const { name, type } = SQLUtils.getNameAndType(pkNode);
                    const fkName = `${entityOther.name}_${name}`;
                    
                    fkColNames.push(fkName);
                    refPkNames.push(name);
                    
                    const nullability = isNotNull ? "NOT NULL" : "NULL";
                    const inlineUnique = !isComposite ? " UNIQUE" : "";

                    columns.push(`    ${fkName} ${type} ${nullability}${inlineUnique}`);
                });

                if (fkColNames.length > 0) {
                    tableConstraints.push(`FOREIGN KEY (${fkColNames.join(", ")}) REFERENCES ${entityOther.name}(${refPkNames.join(", ")})`);
                    if (isComposite) tableConstraints.push(`UNIQUE (${fkColNames.join(", ")})`);
                }

                const relData = nodeRegistry.get(relationNode.id);
                if (relData) {
                    const relPKs = relData.attributes.pk.flat();        
                    const relPkNames: string[] = [];
                    relPKs.forEach(pk => {
                        const { name, type } = SQLUtils.getNameAndType(pk);
                        if (relPKs.length > 1) {
                            columns.push(`    ${name} ${type} NOT NULL`);
                            relPkNames.push(name);
                        } else columns.push(`    ${name} ${type} NOT NULL UNIQUE`);
                    });

                    if (relPKs.length > 1) tableConstraints.push(`UNIQUE (${relPkNames.join(", ")})`);

                    AttributeTransformer.transformUnique(relData, columns, compositeUnique, root);
                    AttributeTransformer.transformSimple(relData, columns, root);
                    AttributeTransformer.transformOptionals(relData, columns);

                    relData.attributes.multiValued.forEach(mv => multivaluedRelation += AttributeTransformer.processMultivalued(entityData.name, entityData.attributes.pk.flat(), mv, root));
                }
            }
        });

        return multivaluedRelation;
    }

    static transform1Nrelation(entityData: NodeData, columns: string[], compositeUnique: string[], tableConstraints: string[], root: GModelElement, nodeRegistry: NodeRegistry) {
        let multivaluedRelation = "";
        const edgeToRelations = root.children.filter(edge => edge instanceof GEdge && edge.sourceId === entityData.node.id) as GEdge[];
        edgeToRelations.forEach(edge => {
            const relationNode = SQLUtils.findById(edge.targetId, root);
            const myCardinality = SQLUtils.getCardinality(edge);
            if (relationNode?.type === RELATION_TYPE && myCardinality.includes("N")) {
                const relationEdges = root.children.filter(edge => edge instanceof GEdge && edge.targetId === relationNode.id && edge.sourceId !== entityData.node.id) as GEdge[];
                const edgeOne = relationEdges.find(edge => !SQLUtils.getCardinality(edge).includes("N"));
                if (edgeOne) {
                    const entityOne = nodeRegistry.get(edgeOne.sourceId);
                    if (entityOne) {
                        entityOne.attributes.pk.flat().forEach(pkNode => {
                            const { name, type } = SQLUtils.getNameAndType(pkNode);
                            const fkName = `${entityOne.name}_${name}`;
                            const isOptional = myCardinality.includes("0");
                            columns.push(`    ${fkName} ${type} ${isOptional ? "NULL" : "NOT NULL"}`);
                            tableConstraints.push(`FOREIGN KEY (${fkName}) REFERENCES ${entityOne.name}(${name})`);
                        });

                        const relData = nodeRegistry.get(relationNode.id);
                        if (relData) {
                            const relPKs = relData.attributes.pk.flat();
                            
                            const relPkNames: string[] = [];
                            relPKs.forEach(pk => {
                                const { name, type } = SQLUtils.getNameAndType(pk);
                                if (relPKs.length > 1) {
                                    columns.push(`    ${name} ${type} NOT NULL`);
                                    relPkNames.push(name);
                                } else columns.push(`    ${name} ${type} NOT NULL UNIQUE`);
                            });
                            if (relPKs.length > 1) tableConstraints.push(`UNIQUE (${relPkNames.join(", ")})`);

                            AttributeTransformer.transformUnique(relData, columns, compositeUnique, root);
                            AttributeTransformer.transformSimple(relData, columns, root);
                            AttributeTransformer.transformOptionals(relData, columns);

                            relData.attributes.multiValued.forEach(mv => {
                                multivaluedRelation = AttributeTransformer.processMultivalued(relData.name, entityOne.attributes.pk.flat(), mv, root);
                            });
                        }
                    }
                }
            }
        });

        return multivaluedRelation;
    }

    static process11RelationBothMandatory(firstEntity: GNode, secondEntity: GNode, relation: NodeData, root: GModelElement, nodeRegistry: NodeRegistry, processedNodes: Set<string>) {
        const columns: string[] = [];
        const compositePK: string[] = [];
        const compositeUnique: string[] = [];
        const secondEntityPks: string[] = [];
        const relationPks: string[] = [];
        const tableConstraints: string[] = [];

        const firstEntityNodeData = nodeRegistry.get(firstEntity.id) as NodeData;
        AttributeTransformer.transformPKs(firstEntityNodeData, columns, compositePK);
        AttributeTransformer.transformUnique(firstEntityNodeData, columns, compositeUnique, root);
        AttributeTransformer.transformSimple(firstEntityNodeData, columns, root);
        AttributeTransformer.transformOptionals(firstEntityNodeData, columns);

        const secondEntityNodeData = nodeRegistry.get(secondEntity.id) as NodeData;
        secondEntityNodeData.attributes.pk.flat().forEach(pk => {
            const { name, type } = SQLUtils.getNameAndType(pk);
            if (secondEntityNodeData.attributes.pk.flat().length > 1) {
                columns.push(`    ${name} ${type} NOT NULL`);
                secondEntityPks.push(name);
            } else columns.push(`    ${name} ${type} NOT NULL UNIQUE`);
        });
        if (secondEntityPks.length > 1) tableConstraints.push(`UNIQUE (${secondEntityPks.join(", ")})`);
        
        AttributeTransformer.transformUnique(secondEntityNodeData, columns, compositeUnique, root);
        AttributeTransformer.transformSimple(secondEntityNodeData, columns, root);
        AttributeTransformer.transformOptionals(secondEntityNodeData, columns);

        relation.attributes.pk.flat().forEach(pk => {
            const { name, type } = SQLUtils.getNameAndType(pk);
            if (relation.attributes.pk.flat().length > 1) {
                columns.push(`    ${name} ${type} NOT NULL`);
                relationPks.push(name);
            } else columns.push(`    ${name} ${type} NOT NULL UNIQUE`);
        });
        if (relationPks.length > 1) tableConstraints.push(`UNIQUE (${relationPks.join(", ")})`);

        AttributeTransformer.transformUnique(relation, columns, compositeUnique, root);
        AttributeTransformer.transformSimple(relation, columns, root);
        AttributeTransformer.transformOptionals(relation, columns);

        if (compositePK.length > 0) tableConstraints.push(`PRIMARY KEY (${compositePK.join(", ")})`);
        tableConstraints.push(...compositeUnique);

        const tableName = `${firstEntityNodeData.name}_${secondEntityNodeData.name}`;
        let sql = SQLUtils.buildTable(tableName, columns, tableConstraints);

        processedNodes.add(firstEntity.id);
        processedNodes.add(secondEntity.id);

        firstEntityNodeData.attributes.multiValued.forEach(mv => {
            sql += AttributeTransformer.processMultivalued(firstEntityNodeData.name, firstEntityNodeData.attributes.pk.flat(), mv, root);
        });

        secondEntityNodeData.attributes.multiValued.forEach(mv => {
            sql += AttributeTransformer.processMultivalued(secondEntityNodeData.name, secondEntityNodeData.attributes.pk.flat(), mv, root);
        });
        
        relation.attributes.multiValued.forEach(mv => {
            sql += AttributeTransformer.processMultivalued(relation.name, firstEntityNodeData.attributes.pk.flat(), mv, root);
        });

        return sql;
    }

}