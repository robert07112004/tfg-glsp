import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../model/tasklist-model-state';
import { ATTRIBUTE_TYPE, attributeTypes, ENTITY_TYPE, KEY_ATTRIBUTE_TYPE, OPTIONAL_EDGE_TYPE, RELATION_TYPE, relationTypes, specializationTypes, WEAK_ENTITY_TYPE, WEIGHTED_EDGE_TYPE } from '../utils/validation-constants';
import { createMarker, getConnectedNeighbors } from '../utils/validation-utils';

/* Normal attribute rules:
 * Attribute not connected to anything.
 * Attribute can only be connected to the same type of attribute or an optional attribute (composite attribute).
 * If attribute is connected to other attributes it must be connected to an entity.
 * Attribute can be connected only to normal relations.
 * Attribute can't be connected to a weighted edge.
 */

@injectable()
export class AttributeValidator {
    @inject(TaskListModelState)
    protected readonly modelState!: TaskListModelState;

    protected get index(): TaskListModelIndex {
        return this.modelState.index;
    }

    validate(node: GNode): Marker | undefined {
        const neighbors = getConnectedNeighbors(node, this.index);

        if (neighbors.length === 0) {
            return createMarker('error', 'Atributo aislado', node.id, 'ERR: sin conectar al modelo');
        }

        let isConnectedToEntity = false;
        let isConnectedToWeakEntity = false;
        let isConnectedToKeyAttribute = false;
        let isConnectedToOtherAttribute = false; 
        let isConnectedToOtherRelation = false;
        let compositeAttributeCount = 0;

        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            const edgeType = edge.type;

            if (edgeType === WEIGHTED_EDGE_TYPE) {
                return createMarker('error', 'Atributo no puede estar conectado a nada mediante una arista ponderada.', node.id, 'ERR: Atributo-aristaPonderada');
            }
            
            if (nodeType === ATTRIBUTE_TYPE || edgeType === OPTIONAL_EDGE_TYPE) {
                compositeAttributeCount++;
            } else if (nodeType === KEY_ATTRIBUTE_TYPE) {
                isConnectedToKeyAttribute = true;
                isConnectedToOtherAttribute = true;
            } else if (attributeTypes.includes(nodeType)) {
                isConnectedToOtherAttribute = true;
            } else if (relationTypes.includes(nodeType) && nodeType !== RELATION_TYPE && !specializationTypes.includes(nodeType)) {
                isConnectedToOtherRelation = true;
            } else if (nodeType === ENTITY_TYPE) {
                isConnectedToEntity = true;
            } else if (nodeType === WEAK_ENTITY_TYPE) {
                isConnectedToWeakEntity = true;
            }
        }

        if ((isConnectedToEntity || isConnectedToWeakEntity) && isConnectedToKeyAttribute) {
            return createMarker('error', 'Atributo conectado a entidad (normal o débil) y a una clave primaria.', node.id, 'ERR: Atributo-entidad-clavePrimaria');
        }
        
        if (compositeAttributeCount == 0 && isConnectedToOtherAttribute) {
            return createMarker('error', 'Atributo normal solo puede conectarse a atributos normales u opcionales.', node.id, 'ERR: Atributo-atributoNormal-atributoOpcional');
        }

        if (isConnectedToOtherRelation) {
            return createMarker('error', 'Atributo normal solo puede conectarse a relaciones normales.', node.id, 'ERR: Atributo-relacion');
        }
        
        if (compositeAttributeCount > 0 && !isConnectedToEntity && !isConnectedToWeakEntity) {
            return createMarker('error', 'Atributo compuesto debe estar conectado a una entidad o entidad débil.', node.id, 'ERR: Atributo-entidad-entidadDebil');
        }

        return undefined;

    }

}