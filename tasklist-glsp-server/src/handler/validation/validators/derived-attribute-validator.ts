import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../model/tasklist-model-state';
import { EXISTENCE_DEP_RELATION_TYPE, IDENTIFYING_DEP_RELATION_TYPE, WEIGHTED_EDGE_TYPE } from '../utils/validation-constants';
import { createMarker, getConnectedNeighbors } from '../utils/validation-utils';

/* Derived attribute rules:
 * Derived attribute not connected to anything.
 * Derived attribute can be connected to another entity, relation, weak entity, specialization. But can't be connected to dependencies.
 * Derived attribute can't be connected to a weighted edge.
 */

@injectable()
export class DerivedAttributeValidator {
    @inject(TaskListModelState)
    protected readonly modelState!: TaskListModelState;

    protected get index(): TaskListModelIndex {
        return this.modelState.index;
    }

    validate(node: GNode): Marker | undefined {
        const neighbors = getConnectedNeighbors(node, this.index);

        if (neighbors.length === 0) {
            return createMarker('error', 'Atributo derivado aislado', node.id, 'ERR: sin conectar al modelo');
        }

        let isConnectedToDependence = false;
        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            const edgeType = edge.type;
            
            if (edgeType === WEIGHTED_EDGE_TYPE) {
                return createMarker('error', 'Atributo derivado no puede estar conectado a nada mediante una arista ponderada.', node.id, 'ERR: Atributo-aristaPonderada');
            }

            if (nodeType === EXISTENCE_DEP_RELATION_TYPE || nodeType === IDENTIFYING_DEP_RELATION_TYPE) {
                isConnectedToDependence = true;
            }

        }

        if (isConnectedToDependence) {
            return createMarker('error', 'Atributo derivado no puede estar conectado a una dependencia.', node.id, 'ERR: atrbutoDerivado-dependencia');
        }

        return undefined;

    }

}