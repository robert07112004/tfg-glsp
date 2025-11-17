import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../model/tasklist-model-state';
import { attributeTypes, entityTypes, KEY_ATTRIBUTE_TYPE, relationTypes, WEIGHTED_EDGE_TYPE } from '../utils/validation-constants';
import { createMarker, getConnectedNeighbors } from '../utils/validation-utils';

/* Relation rules:
 * Relation is not connected to anything.
 * Relation is connected to another relation.
 * Relation is not connected with weighted edges.
 * Relation is connected with key attribute.
 * Relation is connected with a weighted edge to an attribute.
 */

@injectable()
export class RelationValidator {
    @inject(TaskListModelState)
    protected readonly modelState!: TaskListModelState;

    protected get index(): TaskListModelIndex {
        return this.modelState.index;
    }

    validate(node: GNode): Marker | undefined {
        const neighbors = getConnectedNeighbors(node, this.index);

        if (neighbors.length === 0) {
            return createMarker('error', 'Relación aislada', node.id, 'ERR: sin conectar al modelo');
        }

        let isConnectedToRelation = false;
        let entityConnectionCount = 0;
        let weightedEntityConnectionCount = 0;
        let isConnectedToKeyAttribute = false;
        let isConnectedToAttributeWithWeightedEdge = false;

        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            const edgeType = edge.type;
            if (relationTypes.includes(nodeType)) {
                isConnectedToRelation = true;
            }
            else if (attributeTypes.includes(nodeType)) {
                if (nodeType === KEY_ATTRIBUTE_TYPE) {
                    isConnectedToKeyAttribute = true;
                }
                if (edgeType === WEIGHTED_EDGE_TYPE && nodeType !== KEY_ATTRIBUTE_TYPE) {
                    isConnectedToAttributeWithWeightedEdge = true;
                }
            }
            else if (entityTypes.includes(nodeType)) {
                entityConnectionCount++;
                if (edgeType === WEIGHTED_EDGE_TYPE) {
                    weightedEntityConnectionCount++;
                }
            }
        }
        
        if (isConnectedToRelation) {
            return createMarker('error', 'Relación está conectada a otra relación', node.id, 'ERR: relación-relación');
        }

        if (weightedEntityConnectionCount !== entityConnectionCount) {
            return createMarker('error', 'Relación debe estar conectada a entidades mediante aristas ponderadas', node.id, 'ERR: cardinalidad');
        }

        if (isConnectedToKeyAttribute) {
            return createMarker('error', 'Relación no puede estar conectada a un atributo con clave primaria', node.id, 'ERR: relación-sinClavePrimaria');
        }
        
        if (isConnectedToAttributeWithWeightedEdge) {
            return createMarker('error', 'Relación no puede estar conectada a un atributo mediante una arista ponderada', node.id, 'ERR: relación-Atributo-aristaPonderada');
        }

        return undefined;

    }

}