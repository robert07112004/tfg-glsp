import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../model/tasklist-model-state';
import {
    attributeTypes,
    entityTypes,
    KEY_ATTRIBUTE_TYPE,
    relationTypes,
    WEIGHTED_EDGE_TYPE
} from '../utils/validation-constants';
import { createMarker, getConnectedNeighbors } from '../utils/validation-utils';

/* Entity rules:
 * Entity is not connected to anything.
 * Entity is connected to another entity.
 * Entity is not connected to another relation.
 * Entity connected to a relation without a weighted edge.
 * Entity is not connected to an atribute.
 * Entity is not connected to a key attribute but has attributes.
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

        if (neighbors.length === 0) {
            return createMarker('error', 'Entidad aislada', node.id, 'ERR: sin conectar al modelo');
        }

        let isConnectedToEntity = false;
        let isConnectedToRelation = false;
        let isConnectedToRelationWithWeightedEdge = false;
        let isConnectedToAttribute = false;
        let isConnectedToKeyAttribute = false;

        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            if (entityTypes.includes(nodeType)) {
                isConnectedToEntity = true;
            }
            if (relationTypes.includes(nodeType)) {
                isConnectedToRelation = true;
                if (edge.type === WEIGHTED_EDGE_TYPE) {
                    isConnectedToRelationWithWeightedEdge = true;
                }
            }
            if (attributeTypes.includes(nodeType)) {
                isConnectedToAttribute = true;
                if (nodeType === KEY_ATTRIBUTE_TYPE) {
                    isConnectedToKeyAttribute = true;
                }
            }
        }

        if (isConnectedToEntity) {
            return createMarker('error', 'Entidad conectada con otra entidad', node.id, 'ERR: entidad-entidad');
        }

        if (!isConnectedToRelation) {
            return createMarker('error', 'Entidad no conectada a ninguna relación', node.id, 'ERR: entidad-sinRelación');
        }
        
        if (!isConnectedToRelationWithWeightedEdge) {
            return createMarker('error', 'Entidad no conectada a ninguna relación con una arista ponderada', node.id, 'ERR: entidad-sinRelación-aristaPonderada');
        }

        if (!isConnectedToAttribute) {
            return createMarker('error', 'Entidad no conectada a ningún atributo', node.id, 'ERR: entidad-sinAtributo');
        }
        
        if (!isConnectedToKeyAttribute) {
            return createMarker('error', 'Entidad no conectada a ningún atributo que sea una clave primaria', node.id, 'ERR: entidad-sinClavePrimaria');
        }

        return undefined;
    }
}
