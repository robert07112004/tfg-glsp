import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../../model/tasklist-model-state';
import { DEFAULT_EDGE_TYPE, ENTITY_TYPE, entityTypes } from '../../utils/validation-constants';
import { createMarker } from '../../utils/validation-utils';

/* Specializations rules:
 * 1. Specializations not connected to anything.
 * 2. NO weighted edges and optional links allowed.
 * 3. Outcoming edges at least 2 entities
 * 4. One incoming edge from an entity.
 */

@injectable()
export class AllSpecializationsValidator {
    @inject(TaskListModelState)
    protected readonly modelState!: TaskListModelState;

    protected get index(): TaskListModelIndex {
        return this.modelState.index;
    }

    validate(node: GNode): Marker | undefined {
        const getOutgoingEdges = this.index.getOutgoingEdges(node);
        const getIncomingEdges = this.index.getIncomingEdges(node);

        // Rule 1: Specialization not connected to anything.
        if (getIncomingEdges.length === 0 && getOutgoingEdges.length === 0) {
            return createMarker('error', 
                                'Especializacion aislada', 
                                node.id, 
                                'ERR: especializacion-sinConexion'
            );
        }

        // Rule 2: NO weighted edges and optional links allowed.
        for (const edge of getIncomingEdges) {
            if (edge.type !== DEFAULT_EDGE_TYPE) {
                return createMarker('error',
                                    'Una especializacion no puede estar conectada con algo que no sea una arista normal',
                                    node.id,
                                    'ERR: spec-connection'
                );
            }
        }
        // Rule 4: One incoming edge from an entity.
        if (getIncomingEdges.length > 1 && !entityTypes.includes(getIncomingEdges[0].sourceId)) {
            return createMarker('error',
                                'Una especializacion solo puede tener una entidad como padre',
                                node.id,
                                'ERR: spec-connection'
            );
        }

        for (const edge of getOutgoingEdges) {
            if (edge.type !== DEFAULT_EDGE_TYPE) {
                return createMarker('error',
                                    'Una especializacion no puede estar conectada con algo que no sea una arista normal',
                                    node.id,
                                    'ERR: spec-connection'
                );
            }

            // Rule 3: Outcoming edges at least 2 entities
            const getNode = this.index.get(edge.targetId);
            if (getNode.type !== ENTITY_TYPE) {
                return createMarker('error',
                                    'Una especializacion no puede tener como hijos algo que no sea una entidad',
                                    node.id,
                                    'ERR: spec-connection'
                );
            } 
        }

        if (getOutgoingEdges.length < 2) {
            return createMarker('error',
                                    'Una especializacion no puede tener menos de dos hijos',
                                    node.id,
                                    'ERR: spec-connection'
            );
        }

        return undefined;

    }

}