import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ErModelIndex } from '../../../../model/er-model-index';
import { ErModelState } from '../../../../model/er-model-state';
import { SQLUtils } from '../../../generator/sql-utils';
import { relationTypes } from '../../utils/validation-constants';
import { createMarker } from '../../utils/validation-utils';

/* Identifying dependence relation rules:
 * 1. Identifying dependence relation not connected to anything.
 * 2. Identifying dependence relation can't be connected to relations, other dependencies
 * 3. Identifying dependence relation must be connected to an entity, a weak entity with weighted edges. 
 * 4. Cardinality of existende dependence relations can't be N..M or 1..1
 */

@injectable()
export class IdentifyingDependenceRelationValidator {
    @inject(ErModelState)
    protected readonly modelState!: ErModelState;

    protected get index(): ErModelIndex {
        return this.modelState.index;
    }

    validate(node: GNode): Marker | undefined {
        const getOutgoingEdges = this.index.getOutgoingEdges(node);
        const getIncomingEdges = this.index.getIncomingEdges(node);

        // Rule 1: Identifying dependence not connected to anything.
        if (getIncomingEdges.length === 0 && getOutgoingEdges.length === 0) {
            return createMarker('error',
                'Dependencia en identificación no conectada a nada',
                node.id,
                'ERR: identificación-sinConexion'
            );
        }

        // Rule 4: Cardinality of existende dependence relations can't be N..M or 1..1
        if (!SQLUtils.getCardinality(node).includes("1:N")) {
            return createMarker('error',
                'Una dependencia en identificacion no puede ser N:M o 1:1',
                node.id,
                'ERR: IdentifyingDependenceRelationValidator'
            );
        }

        // Rule 2: Identifying dependence relation can't be connected to relations, other dependencies
        for (const edge of getIncomingEdges) {
            if (relationTypes.includes(edge.sourceId)) {
                return createMarker('error',
                    'Una dependencia en identificación no se puede conectar a relaciones',
                    node.id,
                    'ERR: IdentifyingDependenceRelationValidator'
                );
            }
        }

        return undefined;

    }

}