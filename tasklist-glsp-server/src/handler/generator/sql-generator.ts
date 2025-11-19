import {
    GEdge,
    GLabel,
    GModelElement,
    GModelIndex,
    GNode
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { ATTRIBUTE_TYPE, ENTITY_TYPE, KEY_ATTRIBUTE_TYPE } from '../validation/utils/validation-constants';

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

    /**
     * Genera el script SQL completo a partir del modelo gráfico actual.
     */
    public generate(root: GModelElement, index: GModelIndex): string {
        let sqlScript = "-- Script generado por GLSP-ER\n";
        sqlScript += "-- Fecha: " + new Date().toLocaleString() + "\n\n";

        // 1. Identificar todas las Entidades buscando por su clase CSS
        // Recorremos los hijos del root (que es donde están todos los nodos en tu factory)
        const entities = root.children.filter(element => 
            isGNode(element) && element.type === ENTITY_TYPE
        ) as GNode[];

        // 2. Para cada entidad, generamos su tabla
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

        // 3. Buscar atributos conectados
        // En tu modelo, los atributos son nodos conectados por aristas (Edges)
        const connectedAttributes = this.findConnectedAttributes(entity, root);

        if (connectedAttributes.length === 0) {
            // Si no tiene atributos, añadimos una columna dummy o id por defecto para que el SQL sea válido
            columnDefinitions.push(`    id VARCHAR(255) PRIMARY KEY`);
        } else {
            connectedAttributes.forEach(attr => {
                const attrName = this.getNameFromNode(attr);
                const safeAttrName = attrName ? attrName.replace(/\s+/g, '_') : attr.id;
                
                let colDef = `    ${safeAttrName} VARCHAR(255)`;

                if (attr.type === KEY_ATTRIBUTE_TYPE) {
                    colDef += " PRIMARY KEY";
                }
                // Aquí podrías añadir lógica para NOT NULL, UNIQUE, etc.
                
                columnDefinitions.push(colDef);
            });
        }

        tableSql += columnDefinitions.join(",\n");
        tableSql += "\n);\n";

        return tableSql;
    }

    /**
     * Busca nodos de tipo Atributo conectados directamente a la entidad dada.
     */
    private findConnectedAttributes(entity: GNode, root: GModelElement): GNode[] {
        const attributes: GNode[] = [];
        
        // Filtramos todas las aristas del modelo
        const allEdges = root.children.filter(child => isGEdge(child)) as GEdge[];

        // Buscamos aristas que toquen nuestra entidad
        const connectedEdges = allEdges.filter(edge => 
            edge.sourceId === entity.id || edge.targetId === entity.id
        );

        // Para cada arista, miramos el "otro" extremo
        connectedEdges.forEach(edge => {
            const otherNodeId = (edge.sourceId === entity.id) ? edge.targetId : edge.sourceId;
            
            // Buscamos ese nodo en el modelo (usando root.children es seguro porque tu factory aplana todo)
            const otherNode = root.children.find(c => c.id === otherNodeId);
            if (otherNode) {
                if (isGNode(otherNode)) {
                    if (otherNode.type === ATTRIBUTE_TYPE || otherNode.type === KEY_ATTRIBUTE_TYPE) {
                        attributes.push(otherNode);
                    }
                }
            }
        });

        return attributes;
    }

    /**
     * Extrae el texto del primer GLabel encontrado dentro del nodo.
     */
    private getNameFromNode(node: GNode): string | undefined {
        const label = node.children.find(child => isGLabel(child)) as GLabel;
        return label ? label.text : undefined;
    }
}