import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../../model/tasklist-model-state';
import { DEFAULT_EDGE_TYPE, KEY_ATTRIBUTE_TYPE, relationTypes, WEIGHTED_EDGE_TYPE } from '../../utils/validation-constants';
import { createMarker } from '../../utils/validation-utils';

/* Entity rules:
 * 1. Entity not connected to anything.
 * 2. Entity must have a pk.
 * 3. Connected to relations or dependence relations with weighted edges.
 */

@injectable()
export class EntityValidator {
    @inject(TaskListModelState)
    protected readonly modelState!: TaskListModelState;

    protected get index(): TaskListModelIndex {
        return this.modelState.index;
    }

    validate(node: GNode): Marker | undefined {
        const getOutgoingEdges = this.index.getOutgoingEdges(node);
        const getIncomingEdges = this.index.getIncomingEdges(node);

        // Rule 1: Entity not connected to anything.
        if (getIncomingEdges.length === 0 && getOutgoingEdges.length === 0) {
            return createMarker('error', 
                                'Entidad aislada', 
                                node.id, 
                                'ERR: entidad-sinConexion'
            );
        }

        // Rule 2: Entity must have a pk.
        let hasPK = false;
        for (const edge of getOutgoingEdges) {
            if (edge.type === DEFAULT_EDGE_TYPE) {
                const getNode = this.index.get(edge.targetId);
                if (getNode.type === KEY_ATTRIBUTE_TYPE) hasPK = true;
            }

            // Rule 3: Connected to relations with weighted edges.
            if (edge.type !== WEIGHTED_EDGE_TYPE && relationTypes.includes(edge.targetId)) {
                return createMarker('error',
                                    'Entidad conectada a una relacion sin una arista ponderada',
                                    node.id,
                                    'entity-relation-no-weighted-edge'
                )
            }
        }

        if (!hasPK) {
            return createMarker('error',
                                'Entity has no key attribute',
                                node.id,
                                'ERR: entity-noPk'
            );
        } 

        return undefined;
    }
}
