import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ErModelIndex } from '../../../../model/er-model-index';
import { ErModelState } from '../../../../model/er-model-state';
import { SQLUtils } from '../../../generator/sql-utils';
import { attributeTypes, DEFAULT_EDGE_TYPE, OPTIONAL_EDGE_TYPE, WEIGHTED_EDGE_TYPE } from '../../utils/validation-constants';
import { createMarker, hasDefaultName } from '../../utils/validation-utils';

@injectable()
export class ExistenceDependenceRelationValidator {
    @inject(ErModelState)
    protected readonly modelState!: ErModelState;

    protected get index(): ErModelIndex {
        return this.modelState.index as ErModelIndex;
    }

    validate(node: GNode): Marker[] {
        const markers: Marker[] = [];
        const outgoing = this.index.getOutgoingEdges(node);
        const incoming = this.index.getIncomingEdges(node);
        const sourceModel = this.modelState.sourceModel;

        // An isolated node does not allow checking the rest of the rules
        if (incoming.length === 0 && outgoing.length === 0) {
            return [createMarker('error',
                'Esta dependencia en existencia no está conectada a nada. Debe conectarse a una entidad normal y a una entidad débil.',
                node.id, 'ERR: dep-existencia-aislada'
            )];
        }

        // Name: empty / default / duplicate are mutually exclusive
        const name = SQLUtils.cleanNames(node);
        if (!name) {
            markers.push(createMarker('error',
                'El nombre de la dependencia en existencia no puede estar vacío. Escribe un nombre que describa la relación (ej: "Tiene", "Pertenece_a").',
                node.id, 'ERR: dep-existencia-sinNombre'
            ));
        } else if (hasDefaultName(name, 'NewDepRelation')) {
            markers.push(createMarker('error',
                `"${name}" es el nombre por defecto. Asigna un nombre propio a esta dependencia en existencia (ej: "Tiene", "Pertenece_a").`,
                node.id, 'ERR: dep-existencia-nombreDefault'
            ));
        } else if (sourceModel) {
            const normalize = (n: string) => n.replace(/\s+/g, '').toLowerCase();
            const currentName = normalize(name);
            const allRelationNames = [
                ...(sourceModel.relations || []),
                ...(sourceModel.existenceDependentRelations || []),
                ...(sourceModel.identifyingDependentRelations || [])
            ].map(r => normalize(r.name));
            if (allRelationNames.filter(n => n === currentName).length > 1) {
                markers.push(createMarker('error',
                    `Ya existe otra interrelación con el nombre "${name}". Cada interrelación (normal o dependencia) debe tener un nombre único en el modelo.`,
                    node.id, 'ERR: dep-existencia-nombreDuplicado'
                ));
            }
        }

        // At least 2 entity connections (incoming weighted edges)
        const entityConnections = incoming.filter(e => e.type === WEIGHTED_EDGE_TYPE);
        if (entityConnections.length < 2) {
            markers.push(createMarker('error',
                'Una dependencia en existencia debe conectarse a al menos dos entidades usando aristas ponderadas.',
                node.id, 'ERR: dep-existencia-pocasEntidades'
            ));
        }

        // Cardinality must be defined on all connections
        if (sourceModel) {
            const weightedEdges = sourceModel.weightedEdges.filter(e => e.targetId === node.id);
            const hasUndefinedCardinality = weightedEdges.some(
                e => !e.description || e.description.trim() === '' || e.description.trim().includes('New Weighted Edge')
            );
            if (hasUndefinedCardinality) {
                markers.push(createMarker('error',
                    'Todas las conexiones de la dependencia deben tener una cardinalidad definida. Haz doble clic en cada arista ponderada y escribe la cardinalidad.',
                    node.id, 'ERR: dep-existencia-sinCardinalidad'
                ));
            }
        }

        // No duplicate attribute names attached to this dependence
        const seen = new Set<string>();
        for (const edge of outgoing) {
            if (edge.type !== DEFAULT_EDGE_TYPE && edge.type !== OPTIONAL_EDGE_TYPE) continue;
            const targetNode = this.index.get(edge.targetId) as GNode;
            if (!targetNode || !attributeTypes.includes(targetNode.type)) continue;
            const attrName = SQLUtils.cleanNames(targetNode).toLowerCase();
            if (!attrName) continue;
            if (seen.has(attrName)) {
                markers.push(createMarker('error',
                    `La dependencia en existencia tiene dos o más atributos con el nombre "${attrName}". Cada atributo debe tener un nombre único.`,
                    node.id, 'ERR: dep-existencia-atributoDuplicado'
                ));
                break;
            }
            seen.add(attrName);
        }

        return markers;
    }
}
