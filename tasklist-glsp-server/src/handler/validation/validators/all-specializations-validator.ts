import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../model/tasklist-model-state';
import { ATTRIBUTE_TYPE, attributeTypes, DEFAULT_EDGE_TYPE, ENTITY_TYPE } from '../utils/validation-constants';
import { createMarker, getConnectedNeighbors } from '../utils/validation-utils';

/* Specializations rules:
 * Specializations not connected to anything.
 * Specializations can be connected to one or more entities (at least 2 or more).
 * Specializations must be connected through transitions.
 * Specializations can have normal attributes.
 */

@injectable()
export class AllSpecializationsValidator {
    @inject(TaskListModelState)
    protected readonly modelState!: TaskListModelState;

    protected get index(): TaskListModelIndex {
        return this.modelState.index;
    }

    validate(node: GNode): Marker | undefined {
        const neighbors = getConnectedNeighbors(node, this.index);

        if (neighbors.length === 0) {
            return createMarker('error', 'Especialización aislada', node.id, 'ERR: sin conectar al modelo');
        }

        let isConnectedToEntity = 0;
        let isConnectedToOtherAttributes = 0;

        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            const edgeType = edge.type;

            if (nodeType === ENTITY_TYPE) {
                isConnectedToEntity += 1;
            }

            if (edgeType !== DEFAULT_EDGE_TYPE) {
                return createMarker('error', 'Especialización solo puede estar conectada mediante transiciones.', node.id, 'ERR: Especializacion-arista');
            } else if (attributeTypes.includes(nodeType) && nodeType !== ATTRIBUTE_TYPE) {
                isConnectedToOtherAttributes += 1;
            }
        }

        if (isConnectedToEntity < 2) {
            return createMarker('error', 'Especialización tiene que estar conectada a dos o más entidades.', node.id, 'ERR: Especializacion-enitdades');
        }

        if (isConnectedToOtherAttributes > 0) {
            return createMarker('error', 'Especialización solo puede estar conectada a atributos normales.', node.id, 'ERR: Especializacion-atributoNormal');
        }

        return undefined;

    }

}