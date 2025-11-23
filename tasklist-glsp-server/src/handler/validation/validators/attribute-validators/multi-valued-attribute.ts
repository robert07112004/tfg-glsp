import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../../model/tasklist-model-state';
import { attributeTypes, entityTypes, EXISTENCE_DEP_RELATION_TYPE, IDENTIFYING_DEP_RELATION_TYPE, WEIGHTED_EDGE_TYPE } from '../../utils/validation-constants';
import { createMarker, getConnectedNeighbors } from '../../utils/validation-utils';

/* 
 * 1. Multi-valued attribute not connected to anything.
 * 2. Prohibited connections:
 *    - NO weighted edges allowed.
 * 3. Valid connections:
 *    - Entities (Strong/Weak).
 * 4. Multi-valued attributes can't have child attributes.
 * 5. Multi-valued attributes can't be connected to dependencies.
 * 6. Ambiguity: Prevents an attribute from connecting "Entity A --(attribute)-- Entity B".
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

        // Rule 1: Multi valued attribute not connected to anything.
        if (neighbors.length === 0) {
            return createMarker('error', 'Atributo multivaluado aislado', node.id, 'ERR: sin conectar al modelo');
        }

        let ownerCount = 0;
        let isOwner = false;

        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            const edgeType = edge.type;
            
            // Rule 2: Prohibited connections.
            if (edgeType === WEIGHTED_EDGE_TYPE) {
                return createMarker('error', 'Atributo multivaluado no puede estar conectado a nada mediante una arista ponderada.', node.id, 'ERR: Atributo-aristaPonderada');
            }

            // Rule 4: Multi valued attributes can't have child attributes. 
            if (attributeTypes.includes(nodeType)) {
                return createMarker('error', 'Un atributo multivaluado debe ser un nodo final (no puede tener otros atributos conectados).', node.id, 'ERR: multi-valued-child-attribute');
            }

            // Rule 5: Multi valued attributes can't be connected to dependencies.
            if (nodeType === EXISTENCE_DEP_RELATION_TYPE || nodeType === IDENTIFYING_DEP_RELATION_TYPE) {
                return createMarker('error', 'Atributo multivaluado no puede estar conectado a una dependencia.', node.id, 'ERR: multi-valued-dependencies');
            }

            isOwner = entityTypes.includes(nodeType);
            if (isOwner) {
                ownerCount++;
            }

        }

        // Rule 3: Valid connections:
        if (!isOwner) {
            return createMarker(
                'error',
                'El atributo multivaluado tiene que estar conectado a una entidad, relacion o especializacion',
                node.id,
                'ERR: multi-valued-entities-relations-specializations'
            );
        }

        // Ambiguity: Prevents an attribute from connecting "Entity A --(attribute)-- Entity B"
        if (ownerCount > 1) {
            return createMarker('error', 'El atributo multivaluado conecta múltiples elementos (Entidades/Relaciones). Solo debe pertenecer a uno.', node.id, 'ERR: multi-valued-ambiguity');
        }

        return undefined;

    }

}