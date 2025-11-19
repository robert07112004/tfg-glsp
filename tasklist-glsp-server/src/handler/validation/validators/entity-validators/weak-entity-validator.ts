import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../../model/tasklist-model-state';
import {
    attributeTypes,
    DEFAULT_EDGE_TYPE,
    ENTITY_TYPE,
    EXISTENCE_DEP_RELATION_TYPE,
    IDENTIFYING_DEP_RELATION_TYPE,
    KEY_ATTRIBUTE_TYPE,
    WEIGHTED_EDGE_TYPE
} from '../../utils/validation-constants';
import { createMarker, getConnectedNeighbors } from '../../utils/validation-utils';

/* Weak entity rules:
 * Weak entity not connected to anything.
 * Must be connected to an existence dependent relation or an identifying dependent relation with a weighted edge.
 * Must be connected to a normal entity through an existence or identifying dependent relation.
 * If is connected to an existence relation must have a primary key.
 * If is connected to an identifying relation cant have a primary key.
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

        if (neighbors.length === 0) {
            return createMarker('error', 'Entidad débil aislada', node.id, 'ERR: weakEntity-isolated');
        }

        let hasPrimaryKey = false;
        let hasAnyAttribute = false;
        let connectedToExistenceDep = false;
        let connectedToIdentifyingDep = false;
        let connectedToStrongEntityViaDep = false;

        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            const edgeType = edge.type;

            if (attributeTypes.includes(nodeType)) {
                if (edgeType !== DEFAULT_EDGE_TYPE) {
                    return createMarker('error', 'Entidad débil no puede estar conectada a atributos mediante otro tipo de aristas que no sean transiciones.', node.id, 'ERR: weakEntity-noDependence-weightedEdge');
                }
                hasAnyAttribute = true;
                if (nodeType === KEY_ATTRIBUTE_TYPE) {
                    hasPrimaryKey = true;
                }
            } 
            else if (nodeType === EXISTENCE_DEP_RELATION_TYPE) {
                if (edgeType !== WEIGHTED_EDGE_TYPE) {
                    return createMarker('error', 'Entidad débil no está conectada a ninguna dependencia en existencia mediante aristas ponderadas.', node.id, 'ERR: weakEntity-noDependence');
                }
                connectedToExistenceDep = true;
                if (this.isRelationConnectedToStrongEntity(otherNode, node.id)) {
                    connectedToStrongEntityViaDep = true;
                }
            } 
            else if (nodeType === IDENTIFYING_DEP_RELATION_TYPE) {
                if (edgeType !== WEIGHTED_EDGE_TYPE) {
                    return createMarker('error', 'Entidad débil no está conectada a ninguna dependencia en identificacion mediante aristas ponderadas.', node.id, 'ERR: weakEntity-noDependence');
                }
                connectedToIdentifyingDep = true;
                if (this.isRelationConnectedToStrongEntity(otherNode, node.id)) {
                    connectedToStrongEntityViaDep = true;
                }
            }
        }

        if (!connectedToExistenceDep && !connectedToIdentifyingDep) {
            return createMarker('error', 'Entidad débil no está conectada a ninguna dependencia en existencia o identificación.', node.id, 'ERR: weakEntity-noDependence');
        }

        if (!connectedToStrongEntityViaDep) {
            return createMarker('error', 'Entidad débil no está conectada a ninguna entidad fuerte a través de su(s) relación(es) de dependencia.', node.id, 'ERR: weakEntity-noStrongEntity');
        }

        if (connectedToExistenceDep && !hasPrimaryKey) {
            return createMarker('error', 'Entidad débil conectada a una dependencia en existencia debe tener un atributo clave primaria.', node.id, 'ERR: weakEntity-existence-noPrimaryKey');
        }

        if (connectedToIdentifyingDep && hasPrimaryKey) {
            return createMarker('error', 'Entidad débil conectada a una dependencia en identificación no puede tener clave primaria propia (solo clave parcial).', node.id, 'ERR: weakEntity-identifying-hasPrimaryKey');
        }

        if (connectedToIdentifyingDep && !hasAnyAttribute) {
            return createMarker('error', 'Entidad débil con dependencia en identificación debe tener al menos un atributo (por ejemplo, clave parcial).', node.id, 'ERR: weakEntity-identifying-noAttributes');
        }

        return undefined;
    }

    protected isRelationConnectedToStrongEntity(dependenceNode: GNode, originatingWeakEntityId: string): boolean {
        const neighbors = getConnectedNeighbors(dependenceNode, this.index);
        for (const { otherNode, edge } of neighbors) {
            if (otherNode.id === originatingWeakEntityId) {
                continue;
            }
            if (otherNode.type === ENTITY_TYPE && edge.type === WEIGHTED_EDGE_TYPE) {
                return true;
            }
        }
        return false;
    }

}
