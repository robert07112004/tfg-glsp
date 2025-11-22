import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../../model/tasklist-model-state';
import {
    attributeTypes,
    DEFAULT_EDGE_TYPE,
    entityTypes,
    EXISTENCE_DEP_RELATION_TYPE,
    IDENTIFYING_DEP_RELATION_TYPE,
    KEY_ATTRIBUTE_TYPE,
    OPTIONAL_EDGE_TYPE,
    relationTypes,
    specializationTypes,
    WEIGHTED_EDGE_TYPE
} from '../../utils/validation-constants';
import { createMarker, getConnectedNeighbors } from '../../utils/validation-utils';

/* Weak Entity Rules:
 * 1. Weak entity not connected to anything.
 * 2. Must be connected to an existence dependent relation OR an identifying dependent relation.
 * 3. Logic for Keys vs Relation types:
 *    - Existence Dependent -> Must have a Primary Key.
 *    - Identifying Dependent -> Cannot have a Primary Key.
 * 4. Specializations:
 *    - Cannot be a child (Subclass) of a specialization.
 *    - Can be a parent (Superclass) of a specialization.
 *    - Must be connected with transitions (DEFAULT_EDGE_TYPE).
 * 5. Attributes:
 *    - Must be connected with transitions or optional links.
 * 6. Relations:
 *    - Must be connected with weighted edges.
 */

@injectable()
export class WeakEntityValidator {
    @inject(TaskListModelState)
    protected readonly modelState!: TaskListModelState;

    protected get index(): TaskListModelIndex {
        return this.modelState.index;
    }

    validate(node: GNode): Marker | undefined {
        const neighbors = getConnectedNeighbors(node, this.index);

        // Rule 1: Weak entity not connected to anything.
        if (neighbors.length === 0) {
            return createMarker('error', 'Entidad débil aislada', node.id, 'ERR: debil-sinConexion');
        }

        let hasIdentifyingRelation = false;
        let hasExistenceRelation = false;
        let hasKeyAttribute = false;

        for (const { otherNode, edge } of neighbors) {
            const otherType = otherNode.type;
            const edgeType = edge.type;

            // Entity rules: Can't be connected with other entities.
            if (entityTypes.includes(otherType)) {
                return createMarker(
                    'error', 
                    'Una entidad débil no puede conectarse directamente a otra entidad', 
                    node.id, 
                    'ERR: debil-entidad-directa'
                );
            }

            if (specializationTypes.includes(otherType)) {
                // Rule 4a: Cannot be a child (Subclass) of a specialization.
                if (edge.sourceId === otherNode.id && edge.targetId === node.id) {
                    return createMarker(
                        'error', 
                        'Una Entidad Débil NO puede ser una subclase (hija) en una especialización.', 
                        node.id, 
                        'ERR: debil-como-hija-prohibido'
                    );
                }

                // Rule 4c: Must be connected with transitions (DEFAULT_EDGE_TYPE).
                if (edgeType !== DEFAULT_EDGE_TYPE) {
                    return createMarker(
                        'error', 
                        'Las especializaciones deben conectarse mediante transiciones (línea simple)', 
                        node.id, 
                        'ERR: debil-especializacion-arista'
                    );
                }
            } else if (relationTypes.includes(otherType)) {
                if (otherType === IDENTIFYING_DEP_RELATION_TYPE) {
                    hasIdentifyingRelation = true;
                } else if (otherType === EXISTENCE_DEP_RELATION_TYPE) {
                    hasExistenceRelation = true;
                }

                // Rule 6: Must be connected with weighted edges.
                if (edgeType !== WEIGHTED_EDGE_TYPE) {
                    return createMarker(
                        'error', 
                        'Las relaciones deben conectarse mediante aristas ponderadas (línea gruesa)', 
                        node.id, 
                        'ERR: debil-relacion-arista'
                    );
                }
            } else if (attributeTypes.includes(otherType)) {
                if (otherType === KEY_ATTRIBUTE_TYPE) {
                    hasKeyAttribute = true;
                }

                // Rule 5: Must be connected with transitions or optional links.
                if (edgeType !== DEFAULT_EDGE_TYPE && edgeType !== OPTIONAL_EDGE_TYPE) {
                    return createMarker(
                        'error', 
                        'Los atributos deben conectarse mediante transiciones o enlaces opcionales', 
                        node.id, 
                        'ERR: debil-atributo-arista'
                    );
                }
            }
        }

        // Rule 2: Must be connected to an existence dependent relation OR an identifying dependent relation.
        if (!hasIdentifyingRelation && !hasExistenceRelation) {
            return createMarker(
                'error', 
                'La entidad débil debe estar conectada a una Relación de Dependencia (Identificación o Existencia)', 
                node.id, 
                'ERR: debil-sin-dependencia'
            );
        }

        // Rule 3a: Existence Dependent -> Must have a Primary Key.
        if (hasExistenceRelation && !hasKeyAttribute) {
            return createMarker(
                'error', 
                'Una entidad con dependencia de existencia DEBE tener una Clave Primaria', 
                node.id, 
                'ERR: debil-existencia-sinPK'
            );
        }

        // Rule 3b: Identifying Dependent -> Cannot have a Primary Key.
        if (hasIdentifyingRelation && hasKeyAttribute) {
            return createMarker(
                'error', 
                'Una entidad con dependencia de identificación NO puede tener Clave Primaria', 
                node.id, 
                'ERR: debil-identificacion-conPK'
            );
        }

        return undefined;
    }

}
