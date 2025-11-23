import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../../model/tasklist-model-state';
import { attributeTypes, entityTypes, OPTIONAL_EDGE_TYPE, WEIGHTED_EDGE_TYPE } from '../../utils/validation-constants';
import { createMarker, getConnectedNeighbors } from '../../utils/validation-utils';

/* Key attribute rules:
 * 1. Alternative key attribute not connected to anything.
 * 2. Prohibited connections:
 *    - ONLY transitions.
 * 4. Valid connections:
 *    - Entities (Strong/Weak).
 * 5. Alternative key attributes can't have children (NO composite attributes).
 * 6. Ambiguity: Prevents an attribute from connecting "Entity A --(attribute)-- Entity B".
 */

@injectable()
export class AlternativeKeyAttributeValidator {
    @inject(TaskListModelState)
    protected readonly modelState!: TaskListModelState;

    protected get index(): TaskListModelIndex {
        return this.modelState.index;
    }

    validate(node: GNode): Marker | undefined {
        const neighbors = getConnectedNeighbors(node, this.index);

        // Rule 1: Alternative key attribute not connected to anything.
        if (neighbors.length === 0) {
            return createMarker('error', 'Atributo clave alternativa aislado', node.id, 'ERR: sin conectar al modelo');
        }

        let isValidConnection = false;
        let rootOwnerCount = 0; 

        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            const edgeType = edge.type;

            // Rule 2: Prohibited connections.
            if (edgeType === WEIGHTED_EDGE_TYPE || edgeType === OPTIONAL_EDGE_TYPE) {
                return createMarker(
                    'error', 
                    'Atributo de clave alternativa no puede estar conectado a nada mediante una arista ponderada o una arista opcional.', 
                    node.id, 
                    'ERR: Atributo-aristaPonderada-aristaOpcional'
                );
            }

            // Rule 3a Valid connections: Entities (Strong/Weak). 
            if (entityTypes.includes(nodeType)) {
                isValidConnection = true;
                rootOwnerCount++;
            }

            // Rule 4: Alternative key attributes can't have children (NO composite attributes).
            if (attributeTypes.includes(nodeType)) {
                return createMarker(
                    'error', 'Un atributo de clave alternativa no puede ser un atributo compuesto (no puede conectarse a otros atributos).',
                    node.id,
                    'ERR: atributoClaveAñternativa-atributoCompuesto'
                );            
            }
        }

        // Rule 3: Valid connections:
        if (!isValidConnection) {
            return createMarker(
                'error',
                'Un atributo de clave alternativa tiene que estar conectado a una entidad fuerte o débil.',
                node.id,
                'ERR: atributoClaveAlternativa-entities'
            );
        }

        // Ambiguity: Prevents an attribute from connecting "Entity A --(attribute)-- Entity B"
        if (rootOwnerCount > 1) {
            return createMarker(
                'error', 
                'Un atributo no puede pertenecer a múltiples elementos raíz (Entidades/Relaciones/Especializaciones) a la vez.', 
                node.id, 
                'ERR: atributo-ambiguo'
            );
        }

        return undefined;

    }

}

