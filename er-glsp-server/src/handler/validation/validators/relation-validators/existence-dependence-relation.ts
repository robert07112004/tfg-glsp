import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ErModelIndex } from '../../../../model/er-model-index';
import { ErModelState } from '../../../../model/er-model-state';
import { SQLUtils } from '../../../generator/sql-utils';
import { relationTypes, WEIGHTED_EDGE_TYPE } from '../../utils/validation-constants';
import { createMarker } from '../../utils/validation-utils';

@injectable()
export class ExistenceDependenceRelationValidator {
    @inject(ErModelState)
    protected readonly modelState!: ErModelState;

    protected get index(): ErModelIndex {
        return this.modelState.index as ErModelIndex;
    }

    validate(node: GNode): Marker | undefined {
        const outgoing = this.index.getOutgoingEdges(node);
        const incoming = this.index.getIncomingEdges(node);

        // Not isolated
        if (incoming.length === 0 && outgoing.length === 0) {
            return createMarker('error',
                'Esta dependencia en existencia no está conectada a nada. Debe conectarse a una entidad normal y a una entidad débil.',
                node.id, 'ERR: dep-existencia-aislada'
            );
        }

        // Empty name
        const name = SQLUtils.cleanNames(node);
        if (!name) {
            return createMarker('error',
                'El nombre de la dependencia en existencia no puede estar vacío. Escribe un nombre que describa la relación (ej: "Tiene", "Pertenece_a").',
                node.id, 'ERR: dep-existencia-sinNombre'
            );
        }

        // Cannot connect to other relations
        for (const edge of incoming) {
            const sourceNode = this.index.get(edge.sourceId);
            if (sourceNode && relationTypes.includes(sourceNode.type)) {
                return createMarker('error',
                    'Una dependencia en existencia no puede conectarse a otras interrelaciones.',
                    node.id, 'ERR: dep-existencia-conexionRelacion'
                );
            }
        }

        // At least 2 entity connections (incoming weighted edges)
        const entityConnections = incoming.filter(e => e.type === WEIGHTED_EDGE_TYPE);
        if (entityConnections.length < 2) {
            return createMarker('error',
                'Una dependencia en existencia debe conectarse a al menos dos entidades usando aristas ponderadas.',
                node.id, 'ERR: dep-existencia-pocasEntidades'
            );
        }

        // No duplicate relation names across all relation types
        const sourceModel = this.modelState.sourceModel;
        if (sourceModel) {
            const normalize = (n: string) => n.replace(/\s+/g, '').toLowerCase();
            const currentName = normalize(name);
            const allRelationNames = [
                ...(sourceModel.relations || []),
                ...(sourceModel.existenceDependentRelations || []),
                ...(sourceModel.identifyingDependentRelations || [])
            ].map(r => normalize(r.name));
            const count = allRelationNames.filter(n => n === currentName).length;
            if (count > 1) {
                return createMarker('error',
                    `Ya existe otra interrelación con el nombre "${name}". Cada interrelación (normal o dependencia) debe tener un nombre único en el modelo.`,
                    node.id, 'ERR: dep-existencia-nombreDuplicado'
                );
            }
        }

        // Cardinality must be defined on all connections
        if (sourceModel) {
            const weightedEdges = sourceModel.weightedEdges.filter(e => e.targetId === node.id);
            const hasUndefinedCardinality = weightedEdges.some(
                e => !e.description || e.description.trim() === '' || e.description.trim().includes('New Weighted Edge')
            );
            if (hasUndefinedCardinality) {
                return createMarker('error',
                    'Todas las conexiones de la dependencia deben tener una cardinalidad definida. Haz doble clic en cada arista ponderada y escribe la cardinalidad.',
                    node.id, 'ERR: dep-existencia-sinCardinalidad'
                );
            }
        }

        return undefined;
    }
}
