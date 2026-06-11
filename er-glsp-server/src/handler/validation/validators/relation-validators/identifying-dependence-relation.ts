import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ErModelIndex } from '../../../../model/er-model-index';
import { ErModelState } from '../../../../model/er-model-state';
import { SQLUtils } from '../../../generator/sql-utils';
import { relationTypes, WEIGHTED_EDGE_TYPE } from '../../utils/validation-constants';
import { createMarker, hasDefaultName } from '../../utils/validation-utils';

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

        // Not isolated
        if (incoming.length === 0 && outgoing.length === 0) {
            return createMarker('error',
                'Esta dependencia en identificación no está conectada a nada. Debe conectarse a una entidad normal y a una entidad débil.',
                node.id, 'ERR: dep-identificacion-aislada'
            );
        }

        // Empty name
        const name = SQLUtils.cleanNames(node);
        if (!name) {
            return createMarker('error',
                'El nombre de la dependencia en identificación no puede estar vacío. Escribe un nombre que describa la relación (ej: "Se_compone_de", "Contiene").',
                node.id, 'ERR: dep-identificacion-sinNombre'
            );
        }

        // Default name
        if (hasDefaultName(name, 'NewIdentRelation')) {
            return createMarker('error',
                `"${name}" es el nombre por defecto. Asigna un nombre propio a esta dependencia en identificación (ej: "Se_compone_de", "Contiene").`,
                node.id, 'ERR: dep-identificacion-nombreDefault'
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
                    node.id, 'ERR: dep-identificacion-nombreDuplicado'
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
                    node.id, 'ERR: dep-identificacion-sinCardinalidad'
                );
            }
        }

        // Cardinality must be 1:N
        if (!SQLUtils.getCardinality(node).includes('1:N')) {
            return createMarker('error',
                'Una dependencia en identificación siempre debe ser de cardinalidad 1:N: la entidad fuerte participa con cardinalidad 1 y la entidad débil con N. Revisa las cardinalidades en las aristas ponderadas.',
                node.id, 'ERR: dep-identificacion-cardinalidadInvalida'
            );
        }

        // Cannot connect to other relations
        for (const edge of incoming) {
            const sourceNode = this.index.get(edge.sourceId);
            if (sourceNode && relationTypes.includes(sourceNode.type)) {
                return createMarker('error',
                    'Una dependencia en identificación no puede conectarse a otras interrelaciones.',
                    node.id, 'ERR: dep-identificacion-conexionRelacion'
                );
            }
        }

        // At least 2 entity connections (incoming weighted edges)
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
