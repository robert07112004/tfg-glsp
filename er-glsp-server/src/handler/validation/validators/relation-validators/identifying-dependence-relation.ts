import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { SQLUtils } from '../../../generator/sql-utils';
import { ErModelIndex } from '../../../../model/er-model-index';
import { ErModelState } from '../../../../model/er-model-state';
import { relationTypes, WEIGHTED_EDGE_TYPE } from '../../utils/validation-constants';
import { createMarker } from '../../utils/validation-utils';

@injectable()
export class IdentifyingDependenceRelationValidator {
    @inject(ErModelState)
    protected readonly modelState!: ErModelState;

    protected get index(): ErModelIndex {
        return this.modelState.index as ErModelIndex;
    }

    validate(node: GNode): Marker | undefined {
        const outgoing = this.index.getOutgoingEdges(node);
        const incoming = this.index.getIncomingEdges(node);

        // Rule 1: Not isolated
        if (incoming.length === 0 && outgoing.length === 0) {
            return createMarker('error',
                'Esta dependencia en identificación no está conectada a nada. Debe conectarse a una entidad normal y a una entidad débil.',
                node.id, 'ERR: dep-identificacion-aislada'
            );
        }

        // R-1: Empty name
        const name = SQLUtils.cleanNames(node);
        if (!name) {
            return createMarker('error',
                'El nombre de la dependencia en identificación no puede estar vacío. Escribe un nombre que describa la relación (ej: "Se_compone_de", "Contiene").',
                node.id, 'ERR: dep-identificacion-sinNombre'
            );
        }

        // Rule 4: Cardinality must be 1:N
        if (!SQLUtils.getCardinality(node).includes('1:N')) {
            return createMarker('error',
                'Una dependencia en identificación siempre debe ser de cardinalidad 1:N: la entidad fuerte participa con cardinalidad 1 y la entidad débil con N. Revisa las cardinalidades en las aristas ponderadas.',
                node.id, 'ERR: dep-identificacion-cardinalidadInvalida'
            );
        }

        // Rule 2 (B-3 fix): Cannot connect to other relations
        for (const edge of incoming) {
            const sourceNode = this.index.get(edge.sourceId);
            if (sourceNode && relationTypes.includes(sourceNode.type)) {
                return createMarker('error',
                    'Una dependencia en identificación no puede conectarse a otras interrelaciones.',
                    node.id, 'ERR: dep-identificacion-conexionRelacion'
                );
            }
        }

        // R-3: At least 2 entity connections (incoming weighted edges)
        const entityConnections = incoming.filter(e => e.type === WEIGHTED_EDGE_TYPE);
        if (entityConnections.length < 2) {
            return createMarker('error',
                'Una dependencia en identificación debe conectarse a al menos dos entidades usando aristas ponderadas.',
                node.id, 'ERR: dep-identificacion-pocasEntidades'
            );
        }

        return undefined;
    }
}
