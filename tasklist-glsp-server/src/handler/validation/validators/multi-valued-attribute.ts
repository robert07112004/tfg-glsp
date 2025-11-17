import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../model/tasklist-model-state';
import { entityTypes, OPTIONAL_EDGE_TYPE, relationTypes, WEIGHTED_EDGE_TYPE } from '../utils/validation-constants';
import { createMarker, getConnectedNeighbors } from '../utils/validation-utils';

/* 
 * Multi-valued attribute not connected to anything.
 * Multi-valued attribute can't be connected to an entity or relation with an optional edge.
 * Multi-valued attribute can't be connected to a weighted edge.
 */

@injectable()
export class MultiValuedAttributeValidator {
    @inject(TaskListModelState)
    protected readonly modelState!: TaskListModelState;

    protected get index(): TaskListModelIndex {
        return this.modelState.index;
    }

    validate(node: GNode): Marker | undefined {
        const neighbors = getConnectedNeighbors(node, this.index);

        if (neighbors.length === 0) {
            return createMarker('error', 'Atributo multivaluado aislado', node.id, 'ERR: sin conectar al modelo');
        }

        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            const edgeType = edge.type;
            
            if (edgeType === WEIGHTED_EDGE_TYPE) {
                return createMarker('error', 'Atributo multivaluado no puede estar conectado a nada mediante una arista ponderada.', node.id, 'ERR: Atributo-multivaluado-aristaPonderada');
            }

            if (edgeType === OPTIONAL_EDGE_TYPE && (entityTypes.includes(nodeType) || relationTypes.includes(nodeType))) {
                return createMarker('error', 'Atributo multivaluado no puede estar conectado a una entidad o relacion mediante una arista opcional.', node.id, 'ERR: Atributo-multivaluado-aristaOpcional');
            }
        }

        return undefined;

    }

}