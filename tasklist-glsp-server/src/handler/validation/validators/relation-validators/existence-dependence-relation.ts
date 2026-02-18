import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../../model/tasklist-model-state';
import { relationTypes } from '../../utils/validation-constants';
import { createMarker } from '../../utils/validation-utils';

/* Existence dependence relation rules:
 * 1. Identifying dependence relation not connected to anything.
 * 2. Identifying dependence relation can't be connected to relations, other dependencies
 * 3. Existence dependence relation must be connected to an entity and a weak entity. 
 */

@injectable()
export class ExistenceDependenceRelationValidator {
    @inject(TaskListModelState)
    protected readonly modelState!: TaskListModelState;

    protected get index(): TaskListModelIndex {
        return this.modelState.index;
    }

    validate(node: GNode): Marker | undefined {
        const getOutgoingEdges = this.index.getOutgoingEdges(node);
        const getIncomingEdges = this.index.getIncomingEdges(node);

        // Rule 1: Existence dependence not connected to anything.
        if (getIncomingEdges.length === 0 && getOutgoingEdges.length === 0) {
            return createMarker('error', 
                                'Dependencia en existencia no conectada a nada', 
                                node.id, 
                                'ERR: existencia-sinConexion'
            );
        }

        // Rule 2: Existence dependence relation can't be connected to relations, other dependencies
        for (const edge of getIncomingEdges) {
            if (relationTypes.includes(edge.sourceId)) {
                return createMarker('error',
                                    'Una dependencia en existencia no se puede conectar a relaciones',
                                    node.id,
                                    'ERR: existence-connection'
                );
            }
        }

        return undefined;

    }

}