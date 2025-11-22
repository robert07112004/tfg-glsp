import {
    GEdge,
    GLabel,
    GModelElement,
    GModelIndex,
    GNode
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { ALTERNATIVE_KEY_ATTRIBUTE_TYPE, ATTRIBUTE_TYPE, attributeTypes, DERIVED_ATTRIBUTE_TYPE, ENTITY_TYPE, KEY_ATTRIBUTE_TYPE, MULTI_VALUED_ATTRIBUTE_TYPE, OPTIONAL_EDGE_TYPE } from '../validation/utils/validation-constants';

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
        entities.forEach(entity => {
            sqlScript += this.createTableForEntity(entity, root);
            sqlScript += "\n";
        });
        return sqlScript;
    }

    private createTableForEntity(entity: GNode, root: GModelElement): string {
        const tableName = this.getNameFromNode(entity);
        // Si no tiene nombre, usamos el ID como fallback
        const safeTableName = tableName ? tableName.replace(/\s+/g, '_') : entity.id;
        let tableSql = `CREATE TABLE ${safeTableName} (\n`;
        const columnDefinitions: string[] = [];
        let additionalTablesSql = "";
        let connectedAttributes = this.findConnectedAttributes(entity, root);
        connectedAttributes = this.sortAttirbutes(connectedAttributes);
        if (connectedAttributes.length === 0) {
            // Si no tiene atributos, añadimos una columna dummy o id por defecto para que el SQL sea válido
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
        tableSql += columnDefinitions.join(",\n");
        tableSql += "\n);\n";
        return tableSql + additionalTablesSql;
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

    private sortAttirbutes(attributes: GNode[]): GNode[] {
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