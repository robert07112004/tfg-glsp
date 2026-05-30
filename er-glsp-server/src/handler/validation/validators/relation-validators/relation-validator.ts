import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { SQLUtils } from '../../../generator/sql-utils';
import { ErModelIndex } from '../../../../model/er-model-index';
import { ErModelState } from '../../../../model/er-model-state';
import { attributeTypes, DEFAULT_EDGE_TYPE, OPTIONAL_EDGE_TYPE, WEIGHTED_EDGE_TYPE } from '../../utils/validation-constants';
import { createMarker } from '../../utils/validation-utils';

@injectable()
export class RelationValidator {
    @inject(ErModelState)
    protected readonly modelState!: ErModelState;

    protected get index(): ErModelIndex {
        return this.modelState.index as ErModelIndex;
    }

    validate(node: GNode): Marker | undefined {
        const outgoing = this.index.getOutgoingEdges(node);
        const incoming = this.index.getIncomingEdges(node);

        // Rule 1: Relation not connected to anything
        if (incoming.length === 0 && outgoing.length === 0) {
            return createMarker('error',
                'Esta interrelación no está conectada a nada. Debe conectarse a al menos dos entidades con aristas ponderadas.',
                node.id, 'ERR: relacion-aislada'
            );
        }

        // R-1: Empty name
        const name = SQLUtils.cleanNames(node);
        if (!name) {
            return createMarker('error',
                'El nombre de la interrelación no puede estar vacío. Escribe un nombre que describa la relación entre las entidades (ej: "Compra", "Trabaja_en").',
                node.id, 'ERR: relacion-sinNombre'
            );
        }

        // R-3: At least 2 entity connections (incoming weighted edges)
        const entityConnections = incoming.filter(e => e.type === WEIGHTED_EDGE_TYPE);
        if (entityConnections.length < 2) {
            return createMarker('error',
                'Una interrelación debe estar conectada a al menos dos entidades. Conecta las entidades participantes usando aristas ponderadas.',
                node.id, 'ERR: relacion-pocasEntidades'
            );
        }

        // R-5: All entity connections must have cardinality defined
        const sourceModel = this.modelState.sourceModel;
        if (sourceModel) {
            const weightedEdges = sourceModel.weightedEdges.filter(e => e.targetId === node.id);
            const hasUndefinedCardinality = weightedEdges.some(
                e => !e.description || e.description.trim() === '' || e.description.trim().includes('New Weighted Edge')
            );
            if (hasUndefinedCardinality) {
                return createMarker('error',
                    'Todas las conexiones de la interrelación deben tener una cardinalidad definida. Haz doble clic en cada arista ponderada y escribe la cardinalidad (ej: 1..1, 1..N, 0..M).',
                    node.id, 'ERR: relacion-sinCardinalidad'
                );
            }
        }

        // R-7: No duplicate attribute names in relation
        const seen = new Set<string>();
        for (const edge of outgoing) {
            if (edge.type !== DEFAULT_EDGE_TYPE && edge.type !== OPTIONAL_EDGE_TYPE) continue;
            const targetNode = this.index.get(edge.targetId) as GNode;
            if (!targetNode || !attributeTypes.includes(targetNode.type)) continue;
            const attrName = SQLUtils.cleanNames(targetNode).toLowerCase();
            if (!attrName) continue;
            if (seen.has(attrName)) {
                return createMarker('error',
                    `La interrelación tiene dos o más atributos con el nombre "${attrName}". Cada atributo debe tener un nombre único.`,
                    node.id, 'ERR: relacion-atributoDuplicado'
                );
            }
            seen.add(attrName);
        }

        return undefined;
    }
}
