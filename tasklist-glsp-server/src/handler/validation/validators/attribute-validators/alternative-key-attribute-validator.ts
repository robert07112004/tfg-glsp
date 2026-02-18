import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../../model/tasklist-model-state';
import { ATTRIBUTE_TYPE, attributeTypes, DEFAULT_EDGE_TYPE, OPTIONAL_EDGE_TYPE, specializationTypes } from '../../utils/validation-constants';
import { createMarker } from '../../utils/validation-utils';

/* Key attribute rules:
 * 1. Alternative key attribute not connected to anything.
 * 2. Edges: Only Transitions (Default) or Optional Links. NEVER Weighted edges.
 * 3. Can't be connected to specializations
 * 4. Can't connect to attributes that aren't the same type
 */

@injectable()
export class AlternativeKeyAttributeValidator {
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
                                    'No se pueden conectar aristas que no sean transiciones u aristas opcionales a la clave alternativa',
                                    node.id, 
                                    'ERR: transition-edge'
                );
            }

            // Rule 3: Can't be connected to specializations
            const getNode = this.index.get(edge.sourceId) as GNode;
            if (specializationTypes.includes(getNode.type)) {
                return createMarker('error',
                                    'Las claves alternativas no pueden estar conectados a especializaciones',
                                    node.id,
                                    'ERR: connection-pk'
                );
            }
        }

        // Rule 4: Can't connect to attributes that aren't the same type
        for (const edge of getOutgoingEdges) {
            if (edge.type !== DEFAULT_EDGE_TYPE && edge.type !== OPTIONAL_EDGE_TYPE) {
                return createMarker('error', 
                                    'No se pueden conectar aristas que no sean transiciones u aristas opcionales a la clave alternativa',
                                    node.id, 
                                    'ERR: transition-edge'
                );
            }

            const getNode = this.index.get(edge.targetId) as GNode;
            if ((attributeTypes.includes(getNode.type) && getNode.type !== ATTRIBUTE_TYPE)) {
                return createMarker('error',
                                    'Las claves alternativas no pueden estar conectadas a otros atributos que no sean del mismo tipo',
                                    node.id,
                                    'ERR: connection-pk'
                );
            }
        }

        return undefined;
    }

}

