import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../../model/tasklist-model-state';
import { attributeTypes, ENTITY_TYPE, WEAK_ENTITY_TYPE } from '../../utils/validation-constants';
import { createMarker, getConnectedNeighbors } from '../../utils/validation-utils';

/* Existence dependence relation rules:
 * 1. Existence dependence relation not connected to anything.
 * 2. Valid connections:
 *    - Entities (Strong/Weak).
 * 3. Existence dependence relation can't be connected to relations, dependencies and specializations.
 * 4. Existence dependence relation must be connected to an entity and a weak entity. 
 */

@injectable()
export class ExistenceDependenceRelationValidator {
    @inject(TaskListModelState)
    protected readonly modelState!: TaskListModelState;

    protected get index(): TaskListModelIndex {
        return this.modelState.index;
    }

    validate(node: GNode): Marker | undefined {
        const neighbors = getConnectedNeighbors(node, this.index);

        // Rule 1: Existence dependence relation not connected to anything.
        if (neighbors.length === 0) {
            return createMarker('error', 'Dependencia en existencia aislada', node.id, 'ERR: sin conectar al modelo');
        }

        let validConnection = false;
        let entityCount = 0;
        let weakEntityCount = 0;

        for (const { otherNode } of neighbors) {
            const nodeType = otherNode.type;
            
            // Rule 2: Valid connections.
            if (nodeType === ENTITY_TYPE) {
                validConnection = true;
                entityCount++;
            } else if (nodeType === WEAK_ENTITY_TYPE) {
                validConnection = true;
                weakEntityCount++;
            } else if (attributeTypes.includes(nodeType)) {
                validConnection = true;
            }

        }

        // Rule 3: Existence dependence relation can't be connected to relations, dependencies and specializations.
        if (!validConnection) {
            return createMarker(
                'error',
                'Dependencia en existencia no puede conectarse con especializaciones, dependencias u otras relaciones.',
                node.id,
                'ERR: existenceDependence-specializations-dependencies'
            );
        }

        // Rule 4: Existence dependence relation must be connected to an entity and a weak entity.
        if (entityCount != 1 || weakEntityCount != 1) {
            return createMarker(
                'error',
                'Dependencia en existencia debe estar conectada a una entidad y a una entidad debil.',
                node.id,
                'ERR: existenceDependence-entities'
            );
        }

        return undefined;

    }

}