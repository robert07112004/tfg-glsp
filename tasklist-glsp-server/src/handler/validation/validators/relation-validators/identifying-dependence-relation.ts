import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../../model/tasklist-model-state';
import { attributeTypes, DEFAULT_EDGE_TYPE, ENTITY_TYPE, KEY_ATTRIBUTE_TYPE, WEAK_ENTITY_TYPE, WEIGHTED_EDGE_TYPE } from '../../utils/validation-constants';
import { createMarker, getConnectedNeighbors } from '../../utils/validation-utils';

/* Identifying dependence relation rules:
 * Identifying dependence relation not connected to anything.
 * Identifying dependence relation must be connected to one entity and one weak entity with weighted edges.
 * Identifying dependence relation must be connected to a key attribute with a transition.
 * Identifying dependence relation can't be connected to attributes with weighted edges.
 */

@injectable()
export class IdentifyingDependenceRelationValidator {
    @inject(TaskListModelState)
    protected readonly modelState!: TaskListModelState;

    protected get index(): TaskListModelIndex {
        return this.modelState.index;
    }

    validate(node: GNode): Marker | undefined {
        const neighbors = getConnectedNeighbors(node, this.index);

        if (neighbors.length === 0) {
            return createMarker('error', 'Dependencia en identificacion aislada', node.id, 'ERR: sin conectar al modelo');
        }

        let isConnectedToWeightedEdge = 0;
        let isConnectedToEntity = 0;
        let isConnectedToWeakEntity = 0;
        let isConnectedToKeyAttribute = 0;
        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            const edgeType = edge.type;
            
            if (nodeType === ENTITY_TYPE && edgeType === WEIGHTED_EDGE_TYPE) {
                isConnectedToEntity += 1;
                isConnectedToWeightedEdge += 1;
            } else if (nodeType === WEAK_ENTITY_TYPE && edgeType === WEIGHTED_EDGE_TYPE) {
                isConnectedToWeakEntity += 1;
                isConnectedToWeightedEdge += 1;
            }
            if (nodeType === KEY_ATTRIBUTE_TYPE && edgeType === DEFAULT_EDGE_TYPE) {
                isConnectedToKeyAttribute += 1;
            }
            if (edgeType === WEIGHTED_EDGE_TYPE && attributeTypes.includes(nodeType)) {
                return createMarker('error', 'Dependencia en identificacion no puede estar conectada a atributos mediante aristas ponderadas', node.id, 'ERR: identifyingDependence-attributes-weightedEdge');
            }

        }

        if ((isConnectedToEntity != 1 || isConnectedToWeakEntity != 1) && isConnectedToWeightedEdge != 2) {
            return createMarker('error', 'Dependencia en identificacion tiene que estar conectada a una entidad y a una entidad debil mediante aristas ponderadas.', node.id, 'ERR: entitites-weighted-edge');
        }

        if (isConnectedToKeyAttribute != 1) {
            return createMarker('error', 'Dependencia en identificacion tiene que estar conectada a un atributo con clave primaria.', node.id, 'ERR: identifyingDependence-keyAttribute');
        }

        return undefined;

    }

}