import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../../../model/tasklist-model-index';
import { TaskListModelState } from '../../../../model/tasklist-model-state';
import { attributeTypes, DEFAULT_EDGE_TYPE, IDENTIFYING_DEP_RELATION_TYPE, specializationTypes } from '../../utils/validation-constants';
import { createMarker } from '../../utils/validation-utils';

/* Key attribute rules:
 * 1. Key attribute not connected to anything.
 * 2. Can only be connected with transitions.
 * 3. Can't be connected to identifying dependence relations, specializations and all of the other attributes.
 * 4. Key attributes can't have children, only incoming-edges
 */

@injectable()
export class KeyAttributeValidator {

    @inject(TaskListModelState)
    protected readonly modelState!: TaskListModelState;

    protected get index(): TaskListModelIndex {
        return this.modelState.index;
    }

    validate(node: GNode): Marker | undefined {
        const getOutgoingEdges = this.index.getOutgoingEdges(node);
        const getIncomingEdges = this.index.getIncomingEdges(node);

        // Rule 1: Key attribute not connected to anything.
        if (getOutgoingEdges.length === 0 && getIncomingEdges.length === 0) {
            return createMarker('error', 
                                'Atributo clave aislado', 
                                node.id, 
                                'ERR: sin conectar al modelo'
            );
        }

        // Rule 2: Can only be connected with transitions.
        for (const edge of getIncomingEdges) {
            if (edge.type !== DEFAULT_EDGE_TYPE) {
                return createMarker('error', 
                                    'No se pueden conectar aristas que no sean transiciones a la clave primaria',
                                    node.id, 
                                    'ERR: transition-edge'
                );
            }

            // Rule 3: Can't be connected to identifying dependence relations, specializations and all of the other attributes.
            const getNode = this.index.get(edge.sourceId) as GNode;
            if (getNode.type === IDENTIFYING_DEP_RELATION_TYPE || specializationTypes.includes(getNode.type) || attributeTypes.includes(getNode.type)) {
                return createMarker('error',
                                    'Las claves primarias no pueden estar conectadas con dependencias en identificación, especializaciones u otros atributos',
                                    node.id,
                                    'ERR: connection-pk'
                );
            }
        }

        // Rule 4: Key attributes can't have children, only incoming-edges
        if (getOutgoingEdges.length !== 0) {
            return createMarker('error',
                                'Las claves primarias no pueden tener hijos',
                                node.id,
                                'ERR: children-pks'
            );
        }

        return undefined;
    }

}

