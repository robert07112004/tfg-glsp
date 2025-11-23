import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../../model/tasklist-model-state';
import { ENTITY_TYPE, OPTIONAL_EDGE_TYPE, WEAK_ENTITY_TYPE, WEIGHTED_EDGE_TYPE } from '../../utils/validation-constants';
import { createMarker, getConnectedNeighbors } from '../../utils/validation-utils';

/* Specializations rules:
 * 1. Specializations not connected to anything.
 * 2. Prohibited connections:
 *    - NO weighted edges and optional links allowed.
 * 3. Valid connections:
 *    - Entities (Strong/Weak).
 * 4. Specializations must be connected to at leats 2 entities.
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

        // Rule 1: Specializations not connected to anything.
        if (neighbors.length === 0) {
            return createMarker('error', 'Especialización aislada', node.id, 'ERR: sin conectar al modelo');
        }

        let entityCount = 0;

        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            const edgeType = edge.type;

            // Rule 2: Prohibited connections.
            if (edgeType === WEIGHTED_EDGE_TYPE || edgeType === OPTIONAL_EDGE_TYPE) {
                return createMarker(
                    'error', 
                    'Una especialización no puede tener aristas ponderadas (cardinalidad).', 
                    node.id, 
                    'ERR: spec-weighted'
                );
            }

            // Rule 4: Specializations must be connected to at leats 2 entities.
            if (nodeType === ENTITY_TYPE || nodeType === WEAK_ENTITY_TYPE) {
                entityCount++;
            }
            // Rule 3: Valid connections.
            else {
                return createMarker(
                    'error', 
                    'Una especialización no puede estar conectada a algo que no sea una entidad.',
                    node.id, 
                    'ERR: spec-invalid-connection'
                );
            }
        }

        if (entityCount < 2) {
            return createMarker(
                'error', 
                'La especialización debe conectar al menos 2 entidades (1 Superclase y 1 Subclase).', 
                node.id, 
                'ERR: spec-min-entities'
            );
        }

        return undefined;

    }

}