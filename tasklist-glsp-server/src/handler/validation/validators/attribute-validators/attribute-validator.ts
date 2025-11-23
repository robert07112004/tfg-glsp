import { GEdge, GModelElement, GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../../model/tasklist-model-state';
import { ALTERNATIVE_KEY_ATTRIBUTE_TYPE, attributeTypes, entityTypes, KEY_ATTRIBUTE_TYPE, relationTypes, specializationTypes, WEIGHTED_EDGE_TYPE } from '../../utils/validation-constants';
import { createMarker, getConnectedNeighbors } from '../../utils/validation-utils';

/* Normal attribute rules:
 * 1. Attribute not connected to anything.
 * 2. Edges: Only Transitions (Default) or Optional Links. NEVER Weighted edges.
 * 3. Valid Connections (Owners/Children):
 *    - Entities (Strong/Weak).
 *    - Relations (Any type).
 *    - Specializations (Triangles).
 * 4. Prohibited Connections:
 *    - KEY Attributes (Primary/Alternative).
 * 5. Attribute can't be connected through other attributes to more than one Entities/Relations/Specializations.
 * 6. Ambiguity: Prevents an attribute from connecting "Entity A --(attribute)-- Entity B".
 */

@injectable()
export class AttributeValidator {
    @inject(TaskListModelState)
    protected readonly modelState!: TaskListModelState;

    protected get index(): TaskListModelIndex {
        return this.modelState.index;
    }

    validate(node: GNode): Marker | undefined {
        const neighbors = getConnectedNeighbors(node, this.index);

        // Rule 1: Attribute not connected to anything.
        if (neighbors.length === 0) {
            return createMarker('error', 'Atributo aislado', node.id, 'ERR: atributo-sinConexion');
        }

        let rootOwnerCount = 0; 

        for (const { otherNode, edge } of neighbors) {
            const otherType = otherNode.type;
            const edgeType = edge.type;

            // Rule 2: Edges: Only Transitions (Default) or Optional Links. NEVER Weighted edges.
            if (edgeType === WEIGHTED_EDGE_TYPE) {
                return createMarker(
                    'error', 
                    'Los atributos no pueden usar aristas ponderadas (líneas gruesas)', 
                    node.id, 
                    'ERR: atributo-aristaIncorrecta-ponderada'
                );
            }

            // Rule 4: Prohibited connections.
            if (otherType === KEY_ATTRIBUTE_TYPE || otherType === ALTERNATIVE_KEY_ATTRIBUTE_TYPE) {
                return createMarker(
                    'error', 
                    'Un atributo normal no puede conectarse a una Clave (Primaria o Alternativa).', 
                    node.id, 
                    'ERR: atributo-conectado-clave'
                );
            }

            // Rule 3a Valid connections: Entities (Strong/Weak).
            if (entityTypes.includes(otherType)) {
                rootOwnerCount++;
            }
            // Rule 3b Valid connections: Relations (Any type).
            else if (relationTypes.includes(otherType) && !specializationTypes.includes(otherType)) {
                rootOwnerCount++;
            }
            // Rule 3c Valid connections: Specializations.
            else if (specializationTypes.includes(otherType)) {
                rootOwnerCount++;
            }
        }

        // Ambiguity: Prevents an attribute from connecting "Entity A --(attribute)-- Entity B"
        if (rootOwnerCount > 1) {
            return createMarker(
                'error', 
                'Un atributo no puede pertenecer a múltiples elementos raíz (Entidades/Relaciones/Especializaciones) a la vez.', 
                node.id, 
                'ERR: atributo-ambiguo'
            );
        }

        // Rule 5: Attribute can't be connected through other attributes to more than one Entities/Relations/Specializations.
        if (!this.validateAttributeOwners(node, this.modelState.root)) {
            return createMarker(
                'error', 
                'Un atributo no puede estar conectado mediante otros atributos a mas de un elemto raíz (Entidades/Relaciones/Especializaciones).',
                node.id,
                'ERR: atributo-elementosRaiz'
            )
        }

        return undefined;
    }

    private validateAttributeOwners(startNode: GNode, root: GModelElement): boolean {
        const visitedNodes = new Set<string>();
        const foundOwners = new Set<string>();
        const nodesToVisit: GNode[] = [startNode];
        while (nodesToVisit.length > 0) {
            const currentNode = nodesToVisit.pop()!;
            visitedNodes.add(currentNode.id);
            const neighbors = this.getDirectNeighbors(currentNode, root);
            for (const neighbor of neighbors) {
                if (visitedNodes.has(neighbor.id)) {
                    continue;
                }
                if (this.isOwnerElement(neighbor)) {
                    foundOwners.add(neighbor.id);
                    if (foundOwners.size > 1) {
                        return false; 
                    }
                } 
                else if (this.isAttribute(neighbor)) {
                    nodesToVisit.push(neighbor);
                }
            }
        }
        return true; 
    }

    private isOwnerElement(node: GNode): boolean {
        return entityTypes.includes(node.type) || relationTypes.includes(node.type) || specializationTypes.includes(node.type);
    }

    private isAttribute(node: GNode): boolean {
        return attributeTypes.includes(node.type);
    }

    private getDirectNeighbors(node: GNode, root: GModelElement): GNode[] {
        const neighbors: GNode[] = [];
        if (root.children) {
            const edges = root.children.filter(element => element instanceof GEdge) as GEdge[];
            for (const edge of edges) {
                let neighborId: string | undefined;
                if (edge.sourceId === node.id) {
                    neighborId = edge.targetId;
                } else if (edge.targetId === node.id) {
                    neighborId = edge.sourceId;
                }
                if (neighborId) {
                    const neighborNode = root.children.find(c => c.id === neighborId);
                    if (neighborNode && neighborNode instanceof GNode) {
                        neighbors.push(neighborNode);
                    }
                }
            }
        }
        return neighbors;
    }

}