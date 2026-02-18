import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../../model/tasklist-model-state';
import { attributeTypes, DEFAULT_EDGE_TYPE, EXISTENCE_DEP_RELATION_TYPE, IDENTIFYING_DEP_RELATION_TYPE, MULTI_VALUED_ATTRIBUTE_TYPE, OPTIONAL_EDGE_TYPE, specializationTypes } from '../../utils/validation-constants';
import { createMarker } from '../../utils/validation-utils';

/* 
 * 1. Multi-valued attribute not connected to anything.
 * 2. Edges: Only Transitions (Default) or Optional Links. NEVER Weighted edges.
 * 3. Can't be connected to specializations or dependence relations
 * 4. Can't connect to attributes that aren't the same type
 */

@injectable()
export class MultiValuedAttributeValidator {
    @inject(TaskListModelState)
    protected readonly modelState!: TaskListModelState;

    protected get index(): TaskListModelIndex {
        return this.modelState.index;
    }

    validate(node: GNode): Marker | undefined {
        const getOutgoingEdges = this.index.getOutgoingEdges(node);
        const getIncomingEdges = this.index.getIncomingEdges(node);

        // Rule 1: Attribute not connected to anything.
        if (getIncomingEdges.length === 0 && getOutgoingEdges.length === 0) {
            return createMarker('error', 
                                'Atributo aislado', 
                                node.id, 
                                'ERR: atributo-sinConexion'
            );
        }

        // Rule 2: Can only be connected with transitions or optional edges.
        for (const edge of getIncomingEdges) {
            if (edge.type !== DEFAULT_EDGE_TYPE && edge.type !== OPTIONAL_EDGE_TYPE) {
                return createMarker('error', 
                                    'No se pueden conectar aristas que no sean transiciones o aristas opcionales',
                                    node.id, 
                                    'ERR: transition-edge'
                );
            }

            // Rule 3: Can't be connected to specializations or dependence relations
            const getNode = this.index.get(edge.sourceId) as GNode;
            if (specializationTypes.includes(getNode.type) || getNode.type === IDENTIFYING_DEP_RELATION_TYPE || getNode.type === EXISTENCE_DEP_RELATION_TYPE) {
                return createMarker('error',
                                    'Los atributos multivaluados no pueden estar conectados a especializaciones o dependencias',
                                    node.id,
                                    'ERR: connection-mv'
                );
            }
        }

        // Rule 4: Can't connect to attributes that aren't the same type
        for (const edge of getOutgoingEdges) {
            if (edge.type !== DEFAULT_EDGE_TYPE && edge.type !== OPTIONAL_EDGE_TYPE) {
                return createMarker('error', 
                                    'No se pueden conectar aristas que no sean transiciones o aristas opcionales',
                                    node.id, 
                                    'ERR: transition-edge'
                );
            }

            const getNode = this.index.get(edge.targetId) as GNode;
            if (attributeTypes.includes(getNode.type) && getNode.type !== MULTI_VALUED_ATTRIBUTE_TYPE) {
                return createMarker('error',
                                    'Los atributos multivaluados no pueden estar conectados a otros atributos que no sean del mismo tipo',
                                    node.id,
                                    'ERR: connection-mv'
                );
            }
        }

        return undefined;
    }

}