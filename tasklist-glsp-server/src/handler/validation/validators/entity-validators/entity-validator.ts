import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../../model/tasklist-model-state';
import {
    attributeTypes,
    DEFAULT_EDGE_TYPE,
    entityTypes,
    KEY_ATTRIBUTE_TYPE,
    OPTIONAL_EDGE_TYPE,
    relationTypes,
    specializationTypes,
    WEIGHTED_EDGE_TYPE
} from '../../utils/validation-constants';
import { createMarker, getConnectedNeighbors } from '../../utils/validation-utils';

/* Entity rules:
 * 1.- Entity not connected to anything.
 * 2.- Relations:
 *     - If entity connected to relation, must have key attribute.
 *     - If has relations, they can only be connected with weighted edges.
 * 3.- Specializations:
 *     - If entity connected to specialization and is a superclass, it must have key attribute.
 *     - If has specializations, they can only be connected with transitions.
 * 4.- If has attributes, they can only be connected with: transitions and optional links.
 */

@injectable()
export class EntityValidator {
    @inject(TaskListModelState)
    protected readonly modelState!: TaskListModelState;

    protected get index(): TaskListModelIndex {
        return this.modelState.index;
    }

    validate(node: GNode): Marker | undefined {
        const neighbors = getConnectedNeighbors(node, this.index);
        
        // Rule 1: Entity not connected to anything.
        if (neighbors.length === 0) {
            return createMarker('error', 'Entidad aislada', node.id, 'ERR: sin conectar al modelo');
        }

        let hasKeyAttribute = false;
        let isConnectedToRelation = false;
        let isFatherNode = false;

        for (const { otherNode, edge } of neighbors) {
            const otherType = otherNode.type;
            const edgeType = edge.type;

            if (otherType === KEY_ATTRIBUTE_TYPE) {
                hasKeyAttribute = true;
            }

            // Rule 4: If has attributes, they can only be connected with: transitions and optional links.
            if (attributeTypes.includes(otherType)) {
                if (edgeType !== DEFAULT_EDGE_TYPE && edgeType !== OPTIONAL_EDGE_TYPE) {
                    return createMarker(
                        'error', 
                        'Los atributos solo pueden conectarse mediante transiciones o enlaces opcionales', 
                        node.id, 
                        'ERR: atributo-tipoAristaIncorrecto'
                    );
                }
            }

            // Rule 2b: If has relations, they can only be connected with weighted edges.
            if (relationTypes.includes(otherType) && !specializationTypes.includes(otherType)) {
                isConnectedToRelation = true;
                if (edgeType !== WEIGHTED_EDGE_TYPE) {
                    return createMarker(
                        'error', 
                        'Las relaciones solo pueden conectarse mediante aristas ponderadas', 
                        node.id, 
                        'ERR: relacion-tipoAristaIncorrecto'
                    );
                }
            }

            // Rule 3b: If has specializations, they can only be connected with transitions.
            if (specializationTypes.includes(otherType)) {
                if (edge.sourceId === node.id) {
                    isFatherNode = true;
                }
                if (edgeType !== DEFAULT_EDGE_TYPE) {
                    return createMarker(
                        'error', 
                        'Las especializaciones solo pueden conectarse mediante transiciones', 
                        node.id, 
                        'ERR: especializacion-tipoAristaIncorrecto'
                    );
                }
            }

            // Entity rules: Entity can't be connected with another entity
            if (entityTypes.includes(otherType)) {
                return createMarker('error', 'Entidad conectada directamente con otra entidad', node.id, 'ERR: entidad-entidad');
            }
        }

        // Rule 2a: If entity connected to relation, must have key attribute.
        if (isConnectedToRelation && !hasKeyAttribute) {
            return createMarker(
                'error', 
                'Una entidad conectada a una relación debe tener un atributo clave', 
                node.id, 
                'ERR: entidad-relacion-sinClave'
            );
        }

        // Rule 3a: If entity connected to specialization and is a superclass, it must have key attribute.
        if (isFatherNode && !hasKeyAttribute) {
            return createMarker(
                'error', 
                'Una entidad padre en una especialización debe tener un atributo clave', 
                node.id, 
                'ERR: entidad-padre-sinClave'
            );
        }

        return undefined;
    }
}
