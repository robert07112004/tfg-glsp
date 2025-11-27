import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../../model/tasklist-model-state';
import { ENTITY_TYPE, KEY_ATTRIBUTE_TYPE, OPTIONAL_EDGE_TYPE, WEAK_ENTITY_TYPE } from '../../utils/validation-constants';
import { createMarker, getConnectedNeighbors } from '../../utils/validation-utils';

/* Identifying dependence relation rules:
 * 1. Identifying dependence relation not connected to anything.
 * 2. Prohibited connections:
 *    - Optional links aren't allowed.
 * 3. Valid connections:
 *    - Entities (Strong/Weak).
 *    - Key attributes.
 * 4. Identifying dependence relation can't be connected to relations, other dependencies and specializations.
 * 5. Identifying dependence relation must be connected to an entity, a weak entity and a key attribute. 
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

        // Rule 1: Identifying dependence relation not connected to anything.
        if (neighbors.length === 0) {
            return createMarker('error', 'Dependencia en identificación aislada', node.id, 'ERR: sin conectar al modelo');
        }

        let validConnection = false;
        let entityCount = 0;
        let weakEntityCount = 0;
        let keyAttributeCount = 0;

        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            const edgeType = edge.type;
            
            // Rule 2: Prohibited connections.
            if (edgeType === OPTIONAL_EDGE_TYPE) {
                return createMarker(
                    'error',
                    'Una dependencia en identificación no puede estar conectada mediante aristas opcionales.',
                    node.id,
                    'ERR: IdentifyingDependence-optional-edge'
                );
            }

            // Rule 3: Valid connections.
            if (nodeType === ENTITY_TYPE) {
                validConnection = true;
                entityCount++;
            } else if (nodeType === WEAK_ENTITY_TYPE) {
                validConnection = true;
                weakEntityCount++;
            } else if (nodeType === KEY_ATTRIBUTE_TYPE) {
                validConnection = true;
                keyAttributeCount++;
            }

        }

        // Rule 4: Identifying dependence relation can't be connected to relations, other dependencies and specializations.
        if (!validConnection) {
            return createMarker(
                'error',
                'Dependencia en identificación no puede conectarse con especializaciones, dependencias u otras relaciones.',
                node.id,
                'ERR: IdentifyingDependence-specializations-dependencies'
            );
        }

        // Rule 5: Identifying dependence relation must be connected to an entity and a weak entity.
        if (entityCount != 1 || weakEntityCount != 1 || keyAttributeCount != 1) {
            return createMarker(
                'error',
                'Dependencia en identificación debe estar conectada a una entidad, a una entidad debil y a un atributo de clave primaria.',
                node.id,
                'ERR: IdentifyingDependence-entities-keyAttribute'
            );
        }
        
        return undefined;

    }

}