import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../../model/tasklist-model-state';
import {
    attributeTypes,
    DEFAULT_EDGE_TYPE,
    EXISTENCE_DEP_RELATION_TYPE,
    IDENTIFYING_DEP_RELATION_TYPE,
    KEY_ATTRIBUTE_TYPE,
    OPTIONAL_EDGE_TYPE,
    RELATION_TYPE,
    specializationTypes,
    WEIGHTED_EDGE_TYPE
} from '../../utils/validation-constants';
import { createMarker } from '../../utils/validation-utils';

/* Weak Entity Rules:
 * 1. Weak entity not connected to anything.
 * 2. Must be connected to an existence dependent relation OR an identifying dependent relation with weighted edges.
 * 3. Logic for Keys vs Relation types:
 *    - Existence Dependent -> Must have a Primary Key.
 *    - Identifying Dependent -> Cannot have a Primary Key.
 * 4. Specializations:
 *    - Cannot be a child (Subclass) of a specialization.
 *    - Must be connected with transitions (DEFAULT_EDGE_TYPE).
 * 5. Attributes:
 *    - Must be connected with transitions or optional links.
 */

@injectable()
export class WeakEntityValidator {
    @inject(TaskListModelState)
    protected readonly modelState!: TaskListModelState;

    protected get index(): TaskListModelIndex {
        return this.modelState.index;
    }

    validate(node: GNode): Marker | undefined {
        const getOutgoingEdges = this.index.getOutgoingEdges(node);
        const getIncomingEdges = this.index.getIncomingEdges(node);

        // Rule 1: Weak entity not connected to anything.
        if (getIncomingEdges.length === 0 && getOutgoingEdges.length === 0) {
            return createMarker('error', 
                                'Entidad debil aislada', 
                                node.id, 
                                'ERR: entidad-debil-sinConexion'
            );
        }

        // Rule 5: Attributes
        let hasPK = false;
        for (const edge of getOutgoingEdges) {
            if (edge.type === DEFAULT_EDGE_TYPE) {
                const getNode = this.index.get(edge.targetId);
                if (getNode.type === KEY_ATTRIBUTE_TYPE) hasPK = true;
            }

            const getNode = this.index.get(edge.targetId);
            if (attributeTypes.includes(getNode.type) && (edge.type !== DEFAULT_EDGE_TYPE && edge.type !== OPTIONAL_EDGE_TYPE)) {
                return createMarker('error',
                                    'Una entidad debil tiene que estar conectada a sus atributos por aristas normales u opcionales',
                                    node.id,
                                    'ERR: weak-entity-edges'
                );
            }
        }

        // Rule 2: Must be connected to an existence dependent relation OR an identifying dependent relation with weighted edges.
        for (const edge of getOutgoingEdges) {
            const getNode = this.index.get(edge.targetId);
            if (getNode.type === RELATION_TYPE || (edge.type !== WEIGHTED_EDGE_TYPE && (edge.targetId === EXISTENCE_DEP_RELATION_TYPE || edge.targetId === IDENTIFYING_DEP_RELATION_TYPE))) {
                return createMarker('error',
                                    'La entidad debil debe conectarse a una dependencia y siempre con una arista ponderada',
                                    node.id,
                                    'ERR: weak-entity-connection'
                );
            }

            // Rule 3: Logic for Keys vs Relation types:
            if (getNode.type === EXISTENCE_DEP_RELATION_TYPE && !hasPK) {
                return createMarker('error',
                                    'La entidad debil conectada a una dependencia en existencia debe tener clave primaria',
                                    node.id,
                                    'ERR: weak-entity-pk'
                )
            } else if (getNode.type === IDENTIFYING_DEP_RELATION_TYPE && hasPK) {
                return createMarker('error',
                                    'La entidad debil conectada a una dependencia en identificacion no debe tener una clave primaria',
                                    node.id,
                                    'ERR: weak-entity-pk'
                )
            }
        }

        // Rule 4: Specializations
        for (const edge of getIncomingEdges) {
            const getNode = this.index.get(edge.sourceId);
            if (specializationTypes.includes(getNode.type) || edge.type === DEFAULT_EDGE_TYPE) {
                return createMarker('error',
                                    'Una entidad debil no puede ser hija en una especializacion o que le entren aristas normales',
                                    node.id,
                                    'ERR: weak-entity-specialization'
                )
            }
        }

        return undefined;
    }

}
