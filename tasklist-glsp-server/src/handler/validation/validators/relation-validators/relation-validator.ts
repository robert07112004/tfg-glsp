import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../../model/tasklist-model-state';
import { ATTRIBUTE_TYPE, DEFAULT_EDGE_TYPE, DERIVED_ATTRIBUTE_TYPE, ENTITY_TYPE, OPTIONAL_EDGE_TYPE } from '../../utils/validation-constants';
import { createMarker, getConnectedNeighbors } from '../../utils/validation-utils';

/* Relation rules:
 * 1. Relation not connected to anything.
 * 2. Prohibited connections.
 * 3. Valid connections:
 *    - Entities (Strong).
 *    - Attributes.
 * 4. Relations must be connected with at least one entities.
 * 5. Relations can't be connected with specializations, dependencies and other relations.
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

        // Rule 1: Relation not connected to anything.
        if (neighbors.length === 0) {
            return createMarker('error', 'Relación aislada', node.id, 'ERR: sin conectar al modelo');
        }

        let validConnection = false;
        let entityCount = 0;

        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            const edgeType = edge.type;
            
            // Rule 2: Prohibited connections.
            if (edgeType === DEFAULT_EDGE_TYPE && nodeType === ENTITY_TYPE) {
                return createMarker(
                    'error',
                    'Una relación no puede estar conectada a una entidad sin una arista ponderada.',
                    node.id,
                    'ERR: relation-weighted-edge'
                );
            }

            // Rule 3: Valid connections.
            if (nodeType === ENTITY_TYPE) {
                entityCount++;
                validConnection = true;
            } else if (nodeType === DERIVED_ATTRIBUTE_TYPE || (edgeType !== OPTIONAL_EDGE_TYPE && nodeType === ATTRIBUTE_TYPE)) {
                validConnection = true;
            }
            
        }

        // Rule 5: Relations can't be connected with specializations, dependencies and other relations.
        if (!validConnection) {
            return createMarker(
                'error',
                'Relación no puede conectarse con especializaciones, dependencias u otras relaciones.',
                node.id,
                'ERR: relation-specializations-dependencies'
            );
        }

        // Rule 4: Relations must be connected with at least two entities.
        if (entityCount < 1) {
            return createMarker(
                'error',
                'Relación debe estar conectada con al menos una entidad.',
                node.id,
                'ERR: relation-entities'
            );
        }
        
        return undefined;

    }

}