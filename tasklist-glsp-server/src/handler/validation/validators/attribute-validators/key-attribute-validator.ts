import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../../model/tasklist-model-state';
import { attributeTypes, entityTypes, IDENTIFYING_DEP_RELATION_TYPE, OPTIONAL_EDGE_TYPE, relationTypes, WEIGHTED_EDGE_TYPE } from '../../utils/validation-constants';
import { createMarker, getConnectedNeighbors } from '../../utils/validation-utils';

/* Key attribute rules:
 * Key attribute not connected to anything.
 * Key attribute must be connected to another entity.
 * Key attribute can be composed with other normal attributes or optional attributes.
 * Key attribute can be connected to an identifying dependence relation.
 * Key attribute can't be connected to a weighted edge.
 * Key attribute can't be connected to an entity or an identifying relation with an optional edge used in an optional attribute.
 */

@injectable()
export class KeyAttributeValidator {
    @inject(TaskListModelState)
    protected readonly modelState!: TaskListModelState;

    protected get index(): TaskListModelIndex {
        return this.modelState.index;
    }

    validate(node: GNode): Marker | undefined {
        const neighbors = getConnectedNeighbors(node, this.index);

        if (neighbors.length === 0) {
            return createMarker('error', 'Atributo clave aislado', node.id, 'ERR: sin conectar al modelo');
        }

        let isConnectedToEntity = false; 
        let isConnectedToOtherAttribute = false; 
        let isConnectedToIdentifyingDep = false;
        let isConnectedToOtherRelation = false; 

        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            const edgeType = edge.type;

            if (edgeType === WEIGHTED_EDGE_TYPE) {
                return createMarker('error', 'Atributo clave no puede estar conectado a nada mediante una arista ponderada.', node.id, 'ERR: Atributo-aristaPonderada');
            }

            if (edgeType === OPTIONAL_EDGE_TYPE && (entityTypes.includes(nodeType) || nodeType === IDENTIFYING_DEP_RELATION_TYPE)) {
                return createMarker('error', 'Atributo clave no puede conectarse a una entidad o dependencia con una arista opcional.', node.id, 'ERR: AtributoClave-aristaOpcional');
            }

            if (entityTypes.includes(nodeType)) {
                isConnectedToEntity = true;
            } else if (attributeTypes.includes(nodeType)) {
                isConnectedToOtherAttribute = true;
            } else if (nodeType === IDENTIFYING_DEP_RELATION_TYPE) {
                isConnectedToIdentifyingDep = true;
            } else if (relationTypes.includes(nodeType)) {
                isConnectedToOtherRelation = true;
            }
        }

        if (!isConnectedToEntity) {
            return createMarker('error', 'Un atributo de clave primaria tiene que estar conectado a una entidad o a una entidad débil.', node.id, 'ERR: atributoClavePrimaria-entidad-entidadDebil');
        }

        if (isConnectedToOtherAttribute) {
            return createMarker('error', 'Atributo clave solo puede conectarse a atributos normales u opcionales para formar un atributo compuesto.', node.id, 'ERR: atributoClavePrimaria-atributoNormal-atributoOpcional');
        }

        if (isConnectedToOtherRelation && !isConnectedToIdentifyingDep) {
            return createMarker('error', 'Atributo clave solo puede conectarse a una dependencia de identificación.', node.id, 'ERR: atributoClavePrimaria-dependenciaEnIdentificacion');
        }

        return undefined;

    }

}

