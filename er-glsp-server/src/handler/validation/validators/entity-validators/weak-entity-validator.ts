import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ErModelIndex } from '../../../../model/er-model-index';
import { ErModelState } from '../../../../model/er-model-state';
import { SQLUtils } from '../../../generator/sql-utils';
import {
    attributeTypes,
    DEFAULT_EDGE_TYPE,
    EXISTENCE_DEP_RELATION_TYPE,
    IDENTIFYING_DEP_RELATION_TYPE,
    KEY_ATTRIBUTE_TYPE,
    OPTIONAL_EDGE_TYPE,
    relationTypes,
    specializationTypes,
    WEIGHTED_EDGE_TYPE
} from '../../utils/validation-constants';
import { createMarker, hasDefaultName } from '../../utils/validation-utils';

@injectable()
export class WeakEntityValidator {
    @inject(ErModelState)
    protected readonly modelState!: ErModelState;

    protected get index(): ErModelIndex {
        return this.modelState.index as ErModelIndex;
    }

    validate(node: GNode): Marker | undefined {
        const outgoing = this.index.getOutgoingEdges(node);
        const incoming = this.index.getIncomingEdges(node);

        // Weak entity not connected to anything
        if (incoming.length === 0 && outgoing.length === 0) {
            return createMarker('error',
                'Esta entidad débil no está conectada a nada. Debe participar en una dependencia en existencia o en identificación.',
                node.id, 'ERR: entidad-debil-aislada'
            );
        }

        // Empty name
        const name = SQLUtils.cleanNames(node);
        if (!name) {
            return createMarker('error',
                'El nombre de la entidad débil no puede estar vacío. Escribe un nombre que la identifique (ej: "Teléfono", "Línea").',
                node.id, 'ERR: entidad-debil-sinNombre'
            );
        }

        // Default name
        if (hasDefaultName(name, 'NewWeakEntity')) {
            return createMarker('error',
                `"${name}" es el nombre por defecto. Asigna un nombre propio a esta entidad débil (ej: "Teléfono", "Línea").`,
                node.id, 'ERR: entidad-debil-nombreDefault'
            );
        }

        // Duplicate name
        const sourceModel = this.modelState.sourceModel;
        if (sourceModel) {
            const otherNames = [
                ...sourceModel.entities.map(e => e.name.replace(/\s+/g, '').toLowerCase()),
                ...sourceModel.weakEntities.filter(we => we.id !== node.id).map(we => we.name.replace(/\s+/g, '').toLowerCase())
            ];
            if (otherNames.includes(name.toLowerCase())) {
                return createMarker('error',
                    `Ya existe otra entidad con el nombre "${name}". Cada entidad debe tener un nombre único en el diagrama.`,
                    node.id, 'ERR: entidad-debil-nombreDuplicado'
                );
            }
        }

        // Attributes must be connected with normal or optional edges
        let hasPK = false;
        const attrNames: string[] = [];
        for (const edge of outgoing) {
            const targetNode = this.index.get(edge.targetId) as GNode;
            if (!targetNode) continue;

            if (attributeTypes.includes(targetNode.type)) {
                if (edge.type !== DEFAULT_EDGE_TYPE && edge.type !== OPTIONAL_EDGE_TYPE) {
                    return createMarker('error',
                        'Los atributos de una entidad débil deben conectarse con aristas normales u opcionales.',
                        node.id, 'ERR: entidad-debil-aristaAtributo'
                    );
                }
                if (targetNode.type === KEY_ATTRIBUTE_TYPE) hasPK = true;
                const attrName = SQLUtils.cleanNames(targetNode).toLowerCase();
                if (attrName) attrNames.push(attrName);
            }
        }

        // Connections to relations must use weighted edges
        for (const edge of outgoing) {
            const targetNode = this.index.get(edge.targetId) as GNode;
            if (!targetNode) continue;
            if (relationTypes.includes(targetNode.type) && edge.type !== WEIGHTED_EDGE_TYPE) {
                return createMarker('error',
                    'La entidad débil debe conectarse a su dependencia mediante una arista ponderada (la que lleva la cardinalidad).',
                    node.id, 'ERR: entidad-debil-aristaRelacion'
                );
            }
        }

        // A weak entity can only be the dependent (N side) in one identifying dependence
        // It may be the identifier (1 side) in several (that is valid)
        const identifyingDepsAsDependent = outgoing.filter(e => {
            if (this.index.get(e.targetId)?.type !== IDENTIFYING_DEP_RELATION_TYPE) return false;
            const we = this.modelState.sourceModel?.weightedEdges.find(
                w => w.sourceId === node.id && w.targetId === e.targetId
            );
            return !we || SQLUtils.isMany(we.description);
        });
        if (identifyingDepsAsDependent.length > 1) {
            return createMarker('error',
                'Una entidad débil solo puede ser la entidad dependiente (lado N) en una única dependencia en identificación.',
                node.id, 'ERR: entidad-debil-multiplesDependenciasId'
            );
        }

        // PK logic depending on the type of dependence relation
        for (const edge of outgoing) {
            const targetNode = this.index.get(edge.targetId) as GNode;
            if (!targetNode) continue;

            if (targetNode.type === EXISTENCE_DEP_RELATION_TYPE && !hasPK) {
                return createMarker('error',
                    'Una entidad débil conectada a una dependencia en existencia debe tener clave primaria propia.',
                    node.id, 'ERR: entidad-debil-sinClaveExistencia'
                );
            }

            if (targetNode.type === IDENTIFYING_DEP_RELATION_TYPE && hasPK) {
                // Cannot have PK if its connected to an identifying dependence relation (N side)
                const we = this.modelState.sourceModel?.weightedEdges.find(
                    w => w.sourceId === node.id && w.targetId === edge.targetId
                );
                if (!we || SQLUtils.isMany(we.description)) {
                    return createMarker('error',
                        'Una entidad débil conectada a una dependencia en identificación no puede tener clave primaria propia (la obtiene de la entidad identificadora a través de la dependencia).',
                        node.id, 'ERR: entidad-debil-claveEnIdentificacion'
                    );
                }
            }
        }

        // Cannot be a child in a specialization
        for (const edge of incoming) {
            const sourceNode = this.index.get(edge.sourceId) as GNode;
            if (!sourceNode) continue;
            if (specializationTypes.includes(sourceNode.type) || edge.type === DEFAULT_EDGE_TYPE) {
                return createMarker('error',
                    'Una entidad débil no puede ser subclase en una especialización.',
                    node.id, 'ERR: entidad-debil-enEspecializacion'
                );
            }
        }

        // Duplicate attribute names within weak entity
        const seen = new Set<string>();
        for (const attrName of attrNames) {
            if (seen.has(attrName)) {
                return createMarker('error',
                    `Esta entidad débil tiene dos o más atributos con el nombre "${attrName}". Cada atributo debe tener un nombre único.`,
                    node.id, 'ERR: entidad-debil-atributoDuplicado'
                );
            }
            seen.add(attrName);
        }

        return undefined;
    }
}
