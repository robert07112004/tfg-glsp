import {
    GEdge,
    GLabel,
    GModelElement,
    GModelIndex,
    GNode
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { ALTERNATIVE_KEY_ATTRIBUTE_TYPE, ATTRIBUTE_TYPE, attributeTypes, DERIVED_ATTRIBUTE_TYPE, ENTITY_TYPE, EXISTENCE_DEP_RELATION_TYPE, IDENTIFYING_DEP_RELATION_TYPE, KEY_ATTRIBUTE_TYPE, MULTI_VALUED_ATTRIBUTE_TYPE, OPTIONAL_EDGE_TYPE, RELATION_TYPE, WEAK_ENTITY_TYPE } from '../validation/utils/validation-constants';

export function isGNode(element: GModelElement): element is GNode {
    return element instanceof GNode;
}

export function isGEdge(element: GModelElement): element is GEdge {
    return element instanceof GEdge;
}

export function isGLabel(element: GModelElement): element is GLabel {
    return element instanceof GLabel;
}

@injectable()
export class SQLGenerator {

    public generate(root: GModelElement, index: GModelIndex): string {
        let sqlScript = "-- Script generado por GLSP-ER\n";
        sqlScript += "-- Fecha: " + new Date().toLocaleString() + "\n\n";
        
        const entities = root.children.filter(element => 
            isGNode(element) && element.type === ENTITY_TYPE
        ) as GNode[];
        const weaKEntities = root.children.filter(element =>
            isGNode(element) && element.type === WEAK_ENTITY_TYPE
        ) as GNode[];

        const relations = root.children.filter(element => 
            isGNode(element) && element.type === RELATION_TYPE
        ) as GNode[];

        entities.forEach(entity => {
            sqlScript += this.createTableForEntity(entity, root);
            sqlScript += "\n";
        });
        weaKEntities.forEach(weakEntity => {
            sqlScript += this.createTableForWeakEntity(weakEntity, root);
            sqlScript += "\n";
        });

        relations.forEach(relation => {
            sqlScript += this.createTableForRelation(relation, root);
            sqlScript += "\n";
        });

        return sqlScript;
    }

    private createTableForEntity(entity: GNode, root: GModelElement): string {
        const tableName = this.getNameFromNode(entity);
        const safeTableName = tableName ? tableName.replace(/\s+/g, '_') : entity.id;
        let tableSql = `CREATE TABLE ${safeTableName} (\n`;
        const columnDefinitions: string[] = [];
        let additionalTablesSql = "";
        let reflexiveIterations = 0;
        let connectedAttributes = this.findConnectedAttributes(entity, root);
        connectedAttributes = this.sortAttributes(connectedAttributes);
        
        // ATTRIBUTES
        if (connectedAttributes.length === 0) {
            columnDefinitions.push(`    id VARCHAR(255) PRIMARY KEY`);
        } else {
            connectedAttributes.forEach(attr => {
                const attrName = this.getNameFromNode(attr);
                const safeAttrName = attrName ? attrName.replace(/\s+/g, '_') : attr.id;
                const { name, type } = this.splitLabelAttribute(safeAttrName);
                let colDef = "";
                if (attr.type === KEY_ATTRIBUTE_TYPE) {
                    colDef += `    ${name} ${type} PRIMARY KEY`;
                } else if (attr.type === ALTERNATIVE_KEY_ATTRIBUTE_TYPE) {
                    colDef += `    ${name} ${type} UNIQUE`;
                } else if (attr.type === ATTRIBUTE_TYPE) {
                    const compositeAttributes = this.findConnectedAttributes(attr, root);
                    if (compositeAttributes.length > 0) {
                        for (const compositeAttr of compositeAttributes) {
                            const compositeAttrName = this.getNameFromNode(compositeAttr);
                            const safeCompositeAttrName = compositeAttrName ? compositeAttrName.replace(/\s+/g, '_') : compositeAttr.id;
                            const { name, type } = this.splitLabelAttribute(safeCompositeAttrName);
                            columnDefinitions.push(`    ${name} ${type} NOT NULL`);
                        }
                        return;
                    } else {
                        const edge = this.findEdgeBetween(entity, attr, root);
                        if (edge) {
                            if (edge.type === OPTIONAL_EDGE_TYPE) {
                                colDef += `    ${name} ${type} NULL`;
                            } else {
                                colDef += `    ${name} ${type} NOT NULL`;
                            }
                        }
                    }
                } else if (attr.type === DERIVED_ATTRIBUTE_TYPE) {
                    const equation = this.getEquationFromDerivedAttribute(attr);
                    if (equation) {
                        colDef += `    ${name} ${type} GENERATED ALWAYS AS (${equation}) STORED`;
                    }
                } else if (attr.type === MULTI_VALUED_ATTRIBUTE_TYPE) {
                    additionalTablesSql += "\n" + this.createTableMultiValuedAttribute(entity, attr, root);
                }   
                if (colDef) {
                    columnDefinitions.push(colDef);
                }
            });
        }

        // FOREIGN KEYS
        const relations = this.findConnectedRelations(entity, root);
        if (relations.length > 0) {
            relations.forEach(relation => {
                if (!relation.children) return;
                const relationCardinality = this.getCardinalityFromNode(relation);
                const connectedAttributes = this.findConnectedAttributes(relation, root);
                if (relationCardinality === '1:N') {
                    const otherEntity = this.findOtherEntity(relation, entity, root);
                    if (otherEntity) {
                        const weightedEdge = this.findEdgeBetween(entity, relation, root);
                        if (weightedEdge) {
                            const edgeCardinality = this.getCardinalityFromWeightedEdge(weightedEdge);
                            if (edgeCardinality && edgeCardinality.includes('..1')) {
                                const otherEntityPK = this.findPrimaryKey(otherEntity, root);
                                if (otherEntityPK) {
                                    const otherEntityName = this.getNameFromNode(otherEntity);
                                    const safeOtherEntityName = otherEntityName ? otherEntityName.replace(/\s+/g, '_') : otherEntity.id;
                                    const otherEntityPKName = this.getNameFromNode(otherEntityPK);
                                    const safeOtherEntityPKName = otherEntityPKName ? otherEntityPKName.replace(/\s+/g, '_') : otherEntityPK.id;
                                    const otherEntityPKNameType = this.splitLabelAttribute(safeOtherEntityPKName);
                                    const fkColumnName = `${safeOtherEntityName}_${otherEntityPKNameType.name}`;
                                    columnDefinitions.push(`    ${fkColumnName} ${otherEntityPKNameType.type}`);
                                    if (connectedAttributes.length > 0) {
                                        connectedAttributes.forEach(attr => {
                                            const attrName = this.getNameFromNode(attr);
                                            const attrNameType = this.splitLabelAttribute(attrName ? attrName.replace(/\s+/g, '_') : attr.id);
                                            columnDefinitions.push(`    ${attrNameType.name} ${attrNameType.type}`);
                                        });
                                    }
                                    columnDefinitions.push(`    FOREIGN KEY (${fkColumnName}) REFERENCES ${safeOtherEntityName}(${otherEntityPKNameType.name}) ON DELETE SET NULL`);
                                }
                            }
                        }
                    } else {
                        // Reflexive case
                        if (reflexiveIterations == 0) {
                            reflexiveIterations++;
                            const entityPK = this.findPrimaryKey(entity, root);
                            if (entityPK) {
                                const relationName = this.getNameFromNode(relation);
                                const safeRelationName = relationName ? relationName.replace(/\s+/g, '_') : relation.id;
                                const entityPKName = this.getNameFromNode(entityPK);
                                const safeEntityPKName = entityPKName ? entityPKName.replace(/\s+/g, '_') : entityPK.id;
                                const entityPKNameType = this.splitLabelAttribute(safeEntityPKName);
                                const fkColumnName = `${safeRelationName}_${entityPKNameType.name}`;
                                columnDefinitions.push(`    ${fkColumnName} ${entityPKNameType.type}`);
                                if (connectedAttributes.length > 0) {
                                    connectedAttributes.forEach(attr => {
                                        const attrName = this.getNameFromNode(attr);
                                        const attrNameType = this.splitLabelAttribute(attrName ? attrName.replace(/\s+/g, '_') : attr.id);
                                        columnDefinitions.push(`    ${attrNameType.name} ${attrNameType.type}`);
                                    });
                                }
                                columnDefinitions.push(`    FOREIGN KEY (${fkColumnName}) REFERENCES ${safeTableName}(${entityPKNameType.name})`);
                            }
                        }
                    }
                } else if (relationCardinality === '1:1') {
                    const otherEntity = this.findOtherEntity(relation, entity, root);
                    if (otherEntity) {
                        const myEdge = this.findEdgeBetween(entity, relation, root);
                        const otherEdge = this.findEdgeBetween(otherEntity, relation, root);
                        const myCardinality = myEdge ? this.getCardinalityFromWeightedEdge(myEdge) : '0..1';
                        const otherCardinality = otherEdge ? this.getCardinalityFromWeightedEdge(otherEdge) : '0..1';
                        let iAmResponsible = false;
                        const iAmMandatory = myCardinality.includes('1..1');
                        const otherIsMandatory = otherCardinality.includes('1..1');
                        if (iAmMandatory && !otherIsMandatory) {
                            iAmResponsible = true;
                        } else if (!iAmMandatory && otherIsMandatory) {
                            iAmResponsible = false;
                        } else {
                            if (entity.id > otherEntity.id) {
                                iAmResponsible = true;
                            }
                        }
                        if (iAmResponsible) {
                            const otherEntityPK = this.findPrimaryKey(otherEntity, root);
                            if (otherEntityPK) {
                                const otherEntityName = this.getNameFromNode(otherEntity);
                                const safeOtherEntityName = otherEntityName ? otherEntityName.replace(/\s+/g, '_') : otherEntity.id;
                                const otherEntityPKName = this.getNameFromNode(otherEntityPK);
                                const safeOtherEntityPKName = otherEntityPKName ? otherEntityPKName.replace(/\s+/g, '_') : otherEntityPK.id;
                                const otherEntityPKNameType = this.splitLabelAttribute(safeOtherEntityPKName);
                                const fkColumnName = `${safeOtherEntityName}_${otherEntityPKNameType.name}`;
                                columnDefinitions.push(`    ${fkColumnName} ${otherEntityPKNameType.type} UNIQUE`);
                                if (connectedAttributes.length > 0) {
                                    connectedAttributes.forEach(attr => {
                                        const attrName = this.getNameFromNode(attr);
                                        const attrNameType = this.splitLabelAttribute(attrName ? attrName.replace(/\s+/g, '_') : attr.id);
                                        columnDefinitions.push(`    ${attrNameType.name} ${attrNameType.type}`);
                                    });
                                }
                                // Nota: Si la relación es opcional para mi, debería ser ON DELETE SET NULL / si es obliatoria, podria ser ON DELETE CASCADE o RESTRICT
                                columnDefinitions.push(`    FOREIGN KEY (${fkColumnName}) REFERENCES ${safeOtherEntityName}(${otherEntityPKNameType.name})`);
                            }
                        }
                    } else {
                        // Reflexive case
                        if (reflexiveIterations == 0) {
                            reflexiveIterations++;
                            const entityPK = this.findPrimaryKey(entity, root);
                            if (entityPK) {
                                const relationName = this.getNameFromNode(relation);
                                const safeRelationName = relationName ? relationName.replace(/\s+/g, '_') : relation.id;
                                const entityPKName = this.getNameFromNode(entityPK);
                                const safeEntityPKName = entityPKName ? entityPKName.replace(/\s+/g, '_') : entityPK.id;
                                const entityPKNameType = this.splitLabelAttribute(safeEntityPKName);
                                const fkColumnName = `${safeRelationName}_${entityPKNameType.name}`;
                                columnDefinitions.push(`    ${fkColumnName} ${entityPKNameType.type} UNIQUE`);
                                if (connectedAttributes.length > 0) {
                                    connectedAttributes.forEach(attr => {
                                        const attrName = this.getNameFromNode(attr);
                                        const attrNameType = this.splitLabelAttribute(attrName ? attrName.replace(/\s+/g, '_') : attr.id);
                                        columnDefinitions.push(`    ${attrNameType.name} ${attrNameType.type}`);
                                    });
                                }
                                columnDefinitions.push(`    FOREIGN KEY (${fkColumnName}) REFERENCES ${safeTableName}(${entityPKNameType.name})`);
                            }
                        }
                    }
                }
            });
        }
        reflexiveIterations = 0;
        tableSql += columnDefinitions.join(",\n");
        tableSql += "\n);\n";
        return tableSql + additionalTablesSql;
    }

    private createTableForWeakEntity(weakEntity: GNode, root: GModelElement): string {
        const tableName = this.getNameFromNode(weakEntity);
        const safeTableName = tableName ? tableName.replace(/\s+/g, '_') : weakEntity.id;
        let tableSql = `CREATE TABLE ${safeTableName} (\n`;
        const finalTableSQL: string[] = [];
        const columnDefinitions: string[] = [];
        const primaryKeys: string[] = [];
        const foreignKeys: string[] = [];
        let additionalTablesSql = "";
        let connectedAttributes = this.findConnectedAttributes(weakEntity, root);
        connectedAttributes = this.sortAttributes(connectedAttributes);
        
        // ATTRIBUTES
        connectedAttributes.forEach(attr => {
            const attrName = this.getNameFromNode(attr);
            const safeAttrName = attrName ? attrName.replace(/\s+/g, '_') : attr.id;
            const weakEntityPK = this.splitLabelAttribute(safeAttrName);
            let colDef = "";
            if (attr.type === KEY_ATTRIBUTE_TYPE) {
                colDef += `    ${weakEntityPK.name} ${weakEntityPK.type} NOT NULL`;
            } else if (attr.type === ALTERNATIVE_KEY_ATTRIBUTE_TYPE) {
                colDef += `    ${weakEntityPK.name} ${weakEntityPK.type} UNIQUE`;
            } else if (attr.type === ATTRIBUTE_TYPE) {
                const compositeAttributes = this.findConnectedAttributes(attr, root);
                if (compositeAttributes.length > 0) {
                    for (const compositeAttr of compositeAttributes) {
                        const compositeAttrName = this.getNameFromNode(compositeAttr);
                        const safeCompositeAttrName = compositeAttrName ? compositeAttrName.replace(/\s+/g, '_') : compositeAttr.id;
                        const { name, type } = this.splitLabelAttribute(safeCompositeAttrName);
                        columnDefinitions.push(`    ${name} ${type} NOT NULL`);
                    }
                    return;
                } else {
                    const edge = this.findEdgeBetween(weakEntity, attr, root);
                    if (edge) {
                        if (edge.type === OPTIONAL_EDGE_TYPE) {
                            colDef += `    ${weakEntityPK.name} ${weakEntityPK.type} NULL`;
                        } else {
                            colDef += `    ${weakEntityPK.name} ${weakEntityPK.type} NOT NULL`;
                        }
                    }
                }
            } else if (attr.type === DERIVED_ATTRIBUTE_TYPE) {
                const equation = this.getEquationFromDerivedAttribute(attr);
                if (equation) {
                    colDef += `    ${weakEntityPK.name} ${weakEntityPK.type} GENERATED ALWAYS AS (${equation}) STORED`;
                }
            } else if (attr.type === MULTI_VALUED_ATTRIBUTE_TYPE) {
                additionalTablesSql += "\n" + this.createTableMultiValuedAttribute(weakEntity, attr, root);
            }   
            if (colDef) {
                columnDefinitions.push(colDef);
            }
        });      
        const dependenceRelations = this.findConnectedDependenceRelations(weakEntity, root);
        if (dependenceRelations.length > 0) {
            dependenceRelations.forEach(relation => {
                const relationCardinality = this.getCardinalityFromNode(relation);
                const otherEntity = this.findOtherEntity(relation, weakEntity, root);
                if (!otherEntity) return;
                const otherEntityName = this.getNameFromNode(otherEntity);
                const safeOtherEntityName = otherEntityName ? otherEntityName.replace(/\s+/g, '_') : otherEntity.id;
                const otherEntityPK = this.findPrimaryKey(otherEntity, root);
                if (!otherEntityPK) return;
                const otherEntityPKName = this.getNameFromNode(otherEntityPK);
                const safeOtherEntityPKName = otherEntityPKName ? otherEntityPKName.replace(/\s+/g, '_') : otherEntityPK.id;
                const otherEntityPKNameType = this.splitLabelAttribute(safeOtherEntityPKName);
                const fkColumnName = `${safeOtherEntityName}_${otherEntityPKNameType.name}`;
                columnDefinitions.push(`    ${fkColumnName} ${otherEntityPKNameType.type} NOT NULL`);
                foreignKeys.push(`FOREIGN KEY (${fkColumnName}) REFERENCES ${safeOtherEntityName}(${otherEntityPKNameType.name}) ON DELETE CASCADE`);
                if (relation.type === EXISTENCE_DEP_RELATION_TYPE) {
                    // EXISTENCE DEPENDENCE RELATION
                    const weakEntityPK = this.findPrimaryKey(weakEntity, root);
                    if (!weakEntityPK) return;
                    const weakEntityPKName = this.getNameFromNode(weakEntityPK);
                    const safeWeakEntityPKName = weakEntityPKName ? weakEntityPKName.replace(/\s+/g, '_') : weakEntityPK.id;
                    const weakEntityPKNameType = this.splitLabelAttribute(safeWeakEntityPKName);
                    if (relationCardinality === '1:N') {        
                        primaryKeys.push(`${weakEntityPKNameType.name}, ${fkColumnName}`);
                    } else if (relationCardinality === '1:1') {
                        primaryKeys.push(`${fkColumnName}`);
                    }
                    /////////////////////////////////////////////////////////////////////
                    // MOSTRAR ATRIBUTOS UNA VEZ SE REFACTORICE EL CODIGO EN FUNCIONES //
                    /////////////////////////////////////////////////////////////////////
               } else {
                    // IDENTIFYING DEPENDENCE RELATION
                    const identifyingRelationPK = this.findPrimaryKey(relation, root);
                    if (!identifyingRelationPK) return;
                    const pkIdentifyingRelationName = this.getNameFromNode(identifyingRelationPK);
                    const safePkIdentifyingRelationName = pkIdentifyingRelationName ? pkIdentifyingRelationName.replace(/\s+/g, '_') : identifyingRelationPK.id;
                    const pkIdentifyingRelationNameType = this.splitLabelAttribute(safePkIdentifyingRelationName);
                    columnDefinitions.unshift(`    ${pkIdentifyingRelationNameType.name} ${pkIdentifyingRelationNameType.type} NOT NULL`);
                    if (relationCardinality === '1:N') {
                        primaryKeys.push(`${pkIdentifyingRelationNameType.name}, ${fkColumnName}`);
                    } else if (relationCardinality === '1:1') {
                        primaryKeys.push(`${fkColumnName}`);
                    }
                    /////////////////////////////////////////////////////////////////////
                    // MOSTRAR ATRIBUTOS UNA VEZ SE REFACTORICE EL CODIGO EN FUNCIONES //
                    /////////////////////////////////////////////////////////////////////
               }
            });
        }
        if (primaryKeys.length > 0) {
            columnDefinitions.push(`    PRIMARY KEY (${primaryKeys.join(", ")})`);
        }
        foreignKeys.forEach(fk => {
            columnDefinitions.push(`    ${fk}`);
        });
        tableSql += finalTableSQL.join(",\n");
        tableSql += columnDefinitions.join(",\n");
        tableSql += "\n);\n";
        return tableSql + additionalTablesSql;
    }

    private createTableForRelation(relation: GNode, root: GModelElement): string {
        const relationCardinality = this.getCardinalityFromNode(relation);
        if (relationCardinality.includes('N:M')) {
            const tableName = this.getNameFromNode(relation);
            const safeTableName = tableName ? tableName.replace(/\s+/g, '_') : relation.id;
            let tableSql = `CREATE TABLE ${safeTableName} (\n`;
            const tableLines: string[] = [];
            const primaryKeys: string[] = [];
            const foreignKeys: string[] = [];
            const connectedEntities = this.findConnectedEntities(relation, root);
            const connectedAttributes = this.findConnectedAttributes(relation, root);
            connectedEntities.forEach(entity => {
                const entityName = this.getNameFromNode(entity);
                const safeEntityName = entityName ? entityName.replace(/\s+/g, '_') : entity.id;
                const pkNode = this.findPrimaryKey(entity, root);
                if (pkNode) {
                    const pkName = this.getNameFromNode(pkNode);
                    const safePkName = pkName ? pkName.replace(/\s+/g, '_') : pkNode.id;
                    const pkNameType = this.splitLabelAttribute(safePkName);
                    tableLines.push(`    ${safeEntityName}_${pkNameType.name} ${pkNameType.type}`);
                    if (connectedEntities.length == 1) {
                        tableLines.push(`    ${safeTableName}_${pkNameType.name} ${pkNameType.type}`);
                    }
                    primaryKeys.push(`${safeEntityName}_${pkNameType.name}`);
                    if (connectedEntities.length == 1) {
                        primaryKeys.push(`${safeTableName}_${pkNameType.name}`);
                    }
                    foreignKeys.push(`FOREIGN KEY (${safeEntityName}_${pkNameType.name}) REFERENCES ${safeEntityName}(${pkNameType.name})`);
                    if (connectedEntities.length == 1) {
                        foreignKeys.push(`FOREIGN KEY (${safeTableName}_${pkNameType.name}) REFERENCES ${safeEntityName}(${pkNameType.name})`);
                    }
                }
            });
            if (connectedAttributes.length > 0) {
                connectedAttributes.forEach(attr => {
                    const attrName = this.getNameFromNode(attr);
                    const attrNameType = this.splitLabelAttribute(attrName ? attrName.replace(/\s+/g, '_') : attr.id);
                    tableLines.push(`    ${attrNameType.name} ${attrNameType.type}`);
                });
            }
            if (primaryKeys.length > 0) {
                tableLines.push(`    PRIMARY KEY (${primaryKeys.join(", ")})`);
            }
            foreignKeys.forEach(fk => {
                tableLines.push(`    ${fk}`);
            });
            tableSql += tableLines.join(",\n");
            tableSql += "\n);\n";
            return tableSql;
        } else {
            return "";
        }
    }

    private findPrimaryKey(entity: GNode, root: GModelElement): GNode | undefined {
        const attributes = this.findConnectedAttributes(entity, root);
        return attributes.find(attr => attr.type === KEY_ATTRIBUTE_TYPE);
    }
    
    private findOtherEntity(relation: GNode, currentEntity: GNode, root: GModelElement): GNode | undefined {
        const connectedEntities = this.findConnectedEntities(relation, root);
        const other = connectedEntities.find(e => e.id !== currentEntity.id);
        if (other) return other;
        else return undefined;
    }

    private getCardinalityFromNode(node: GNode): string {
        const cardinalityLabel = node.children.find(child => 
            isGLabel(child) && 
            (child.type === 'label:cardinality' || child.id === `${node.id}_cardinality_label`)
        ) as GLabel | undefined;
        return cardinalityLabel ? cardinalityLabel.text : ''; 
    }

    private getCardinalityFromWeightedEdge(edge: GEdge): string {
        const cardinalityLabel = edge.children.find(child => 
            isGLabel(child) && child.type === 'label:weighted'
        ) as GLabel | undefined;
        return cardinalityLabel ? cardinalityLabel.text : '';
    }

    private findConnectedRelations(entity: GNode, root: GModelElement): GNode[] {
        const relations: GNode[] = [];
        const allEdges = root.children.filter(child => isGEdge(child)) as GEdge[];
        const connectedEdges = allEdges.filter(edge => 
            edge.sourceId === entity.id || edge.targetId === entity.id
        );
        connectedEdges.forEach(edge => {
            const otherNodeId = (edge.sourceId === entity.id) ? edge.targetId : edge.sourceId;
            const otherNode = root.children.find(c => c.id === otherNodeId);
            if (otherNode) {
                if (isGNode(otherNode)) {
                    if (otherNode.type === RELATION_TYPE) {
                        relations.push(otherNode);
                    }
                }
            }
        });
        return relations;
    }

    private findConnectedDependenceRelations(weakEntity: GNode, root: GModelElement): GNode[] {
        const dependenceRelations: GNode[] = [];
        const allEdges = root.children.filter(child => isGEdge(child)) as GEdge[];
        const connectedEdges = allEdges.filter(edge => 
            edge.sourceId === weakEntity.id || edge.targetId === weakEntity.id
        );
        connectedEdges.forEach(edge => {
            const otherNodeId = (edge.sourceId === weakEntity.id) ? edge.targetId : edge.sourceId;
            const otherNode = root.children.find(c => c.id === otherNodeId);
            if (otherNode) {
                if (isGNode(otherNode)) {
                    if (otherNode.type === EXISTENCE_DEP_RELATION_TYPE || otherNode.type === IDENTIFYING_DEP_RELATION_TYPE) {
                        dependenceRelations.push(otherNode);
                    }
                }
            }
        });
        return dependenceRelations;
    }

    private createTableMultiValuedAttribute(entity: GNode, attribute: GNode, root: GModelElement): string {
        const entityRawName = this.getNameFromNode(entity);
        const entityTableName = entityRawName ? entityRawName.replace(/\s+/g, '_') : entity.id;
        const attrRawName = this.getNameFromNode(attribute);
        const safeAttrLabel = attrRawName ? attrRawName.replace(/\s+/g, '_') : attribute.id;
        const { name: multiValName, type: multiValType } = this.splitLabelAttribute(safeAttrLabel);
        const newTableName = `${multiValName}_${entityTableName}`;
        let tableSql = `CREATE TABLE ${newTableName} (\n`;
        const lines: string[] = [];
        const connectedAttributes = this.findConnectedAttributes(entity, root);
        const pkNode = connectedAttributes.find(attr => attr.type === KEY_ATTRIBUTE_TYPE);
        if (pkNode) {
            const pkRawName = this.getNameFromNode(pkNode);
            const safePkRawName = pkRawName ? pkRawName.replace(/\s+/g, '_') : pkNode.id;
            const { name: pkName, type: pkType } = this.splitLabelAttribute(safePkRawName);
            lines.push(`    ${pkName} ${pkType}`); 
            lines.push(`    ${multiValName} ${multiValType}`);
            lines.push(`    PRIMARY KEY (${pkName}, ${multiValName})`);
            lines.push(`    FOREIGN KEY (${pkName}) REFERENCES ${entityTableName}(${pkName}) ON DELETE CASCADE`);
        }
        tableSql += lines.join(",\n");
        tableSql += "\n);\n";
        return tableSql;
    }

    private findConnectedEntities(relation: GNode, root: GModelElement): GNode[] {
        const entities: GNode[] = [];
        const seenIds = new Set<string>();
        const allEdges = root.children.filter(child => isGEdge(child)) as GEdge[];
        const connectedEdges = allEdges.filter(edge => 
            edge.sourceId === relation.id || edge.targetId === relation.id
        );
        connectedEdges.forEach(edge => {
            const otherNodeId = (edge.sourceId === relation.id) ? edge.targetId : edge.sourceId;
            const otherNode = root.children.find(c => c.id === otherNodeId);
            if (otherNode && isGNode(otherNode)) {
                if (otherNode.type === ENTITY_TYPE) {
                    if (!seenIds.has(otherNode.id)) {
                        seenIds.add(otherNode.id);
                        entities.push(otherNode);
                    }
                }
            }
        });
        return entities;
    }

    private findConnectedAttributes(entity: GNode, root: GModelElement): GNode[] {
        const attributes: GNode[] = [];
        const allEdges = root.children.filter(child => isGEdge(child)) as GEdge[];
        const connectedEdges = allEdges.filter(edge => 
            edge.sourceId === entity.id || edge.targetId === entity.id
        );
        connectedEdges.forEach(edge => {
            const otherNodeId = (edge.sourceId === entity.id) ? edge.targetId : edge.sourceId;
            const otherNode = root.children.find(c => c.id === otherNodeId);
            if (otherNode) {
                if (isGNode(otherNode)) {
                    if (attributeTypes.includes(otherNode.type)) {
                        attributes.push(otherNode);
                    }
                }
            }
        });
        return attributes;
    }

    private getNameFromNode(node: GNode): string | undefined {
        const label = node.children.find(child => isGLabel(child)) as GLabel;
        return label ? label.text : undefined;
    }

    private getEquationFromDerivedAttribute(node: GNode): string | undefined {
        const equationLabel = node.children.find(child => 
            isGLabel(child) && child.id === `${node.id}_equation_label`
        ) as GLabel | undefined;
        return equationLabel ? equationLabel.text : undefined;   
    }

    private splitLabelAttribute(label: string) {
        const [name, type] = label.split(':');
        const typeAttribute = type.replace('_', '').toUpperCase();
        return {
            name: name,
            type: typeAttribute
        }
    }

    private sortAttributes(attributes: GNode[]): GNode[] {
        const priorities: Record<string, number> = {
            [KEY_ATTRIBUTE_TYPE]: 1,             
            [ALTERNATIVE_KEY_ATTRIBUTE_TYPE]: 2, 
            [ATTRIBUTE_TYPE]: 3,                 
            [DERIVED_ATTRIBUTE_TYPE]: 4,      
            [MULTI_VALUED_ATTRIBUTE_TYPE]: 5  
        };
        return attributes.sort((a, b) => {
            const pesoA = priorities[a.type] ?? 99;
            const pesoB = priorities[b.type] ?? 99;
            return pesoA - pesoB;
        });
    }

    private findEdgeBetween(nodeA: GNode, nodeB: GNode, root: GModelElement): GEdge | undefined {
        return root.children.find(element => 
            isGEdge(element) && 
            (
                (element.sourceId === nodeA.id && element.targetId === nodeB.id) ||
                (element.sourceId === nodeB.id && element.targetId === nodeA.id)
            )
        ) as GEdge | undefined;
    }

}