import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../../model/tasklist-model-state';
import { DEFAULT_EDGE_TYPE, OPTIONAL_EDGE_TYPE, specializationTypes } from '../../utils/validation-constants';
import { createMarker } from '../../utils/validation-utils';

/* Derived attribute rules:
 * 1. Derived attribute not connected to anything.
 * 2. Edges: Only Transitions (Default) or Optional Links. NEVER Weighted edges.
 * 3. Can't be connected to specializations
 * 4. Derived attributes can't have child attributes.
 */

@injectable()
export class DerivedAttributeValidator {
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

            // Rule 3: Can't be connected to specializations
            const getNode = this.index.get(edge.sourceId) as GNode;
            if (specializationTypes.includes(getNode.type)) {
                return createMarker('error',
                                    'Los atributos derivados no pueden estar conectados a especializaciones',
                                    node.id,
                                    'ERR: connection-pk'
                );
            }
        }

        // Rule 4: Derived attributes can't have child attributes.
        if (getOutgoingEdges.length > 0) {
            return createMarker('error',
                                'Los atributos derivados no pueden tener hijos',
                                node.id,
                                'ERR: connection-derived-attribute'
            );
        }

        return undefined;
    }

}