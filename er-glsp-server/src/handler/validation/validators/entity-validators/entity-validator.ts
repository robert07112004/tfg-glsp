import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { SQLUtils } from '../../../generator/sql-utils';
import { ErModelIndex } from '../../../../model/er-model-index';
import { ErModelState } from '../../../../model/er-model-state';
import { attributeTypes, DEFAULT_EDGE_TYPE, KEY_ATTRIBUTE_TYPE, OPTIONAL_EDGE_TYPE, relationTypes, specializationTypes, WEIGHTED_EDGE_TYPE } from '../../utils/validation-constants';
import { createMarker } from '../../utils/validation-utils';

@injectable()
export class EntityValidator {
    @inject(ErModelState)
    protected readonly modelState!: ErModelState;

    protected get index(): ErModelIndex {
        return this.modelState.index as ErModelIndex;
    }

    validate(node: GNode): Marker | undefined {
        const outgoing = this.index.getOutgoingEdges(node);
        const incoming = this.index.getIncomingEdges(node);

        // Rule 1: Entity not connected to anything
        if (incoming.length === 0 && outgoing.length === 0) {
            return createMarker('error',
                'Esta entidad no está conectada a nada. Debe participar en al menos una interrelación.',
                node.id, 'ERR: entidad-aislada'
            );
        }

        // E-1: Empty name
        const name = SQLUtils.cleanNames(node);
        if (!name) {
            return createMarker('error',
                'El nombre de la entidad no puede estar vacío. Escribe un nombre que identifique a esta entidad (ej: "Cliente", "Producto").',
                node.id, 'ERR: entidad-sinNombre'
            );
        }

        // E-2: Duplicate entity name
        const sourceModel = this.modelState.sourceModel;
        if (sourceModel) {
            const otherNames = [
                ...sourceModel.entities.filter(e => e.id !== node.id).map(e => e.name.replace(/\s+/g, '').toLowerCase()),
                ...sourceModel.weakEntities.map(e => e.name.replace(/\s+/g, '').toLowerCase())
            ];
            if (otherNames.includes(name.toLowerCase())) {
                return createMarker('error',
                    `Ya existe otra entidad con el nombre "${name}". Cada entidad debe tener un nombre único en el diagrama, ya que cada una genera una tabla diferente en SQL.`,
                    node.id, 'ERR: entidad-nombreDuplicado'
                );
            }
        }

        // Rule 2: Must have a PK unless it is a child of a specialization
        let isChildOfSpecialization = false;
        for (const edge of incoming) {
            if (edge.type === DEFAULT_EDGE_TYPE) {
                const sourceNode = this.index.get(edge.sourceId);
                if (sourceNode && specializationTypes.includes(sourceNode.type)) {
                    isChildOfSpecialization = true;
                }
            }
        }

        let hasPK = false;
        const attrNames: string[] = [];
        for (const edge of outgoing) {
            const targetNode = this.index.get(edge.targetId) as GNode;
            if (!targetNode) continue;

            // Rule 3 (B-1 fix): connections to relations must use weighted edges
            if (edge.type !== WEIGHTED_EDGE_TYPE && relationTypes.includes(targetNode.type)) {
                return createMarker('error',
                    'La conexión entre una entidad y una interrelación debe hacerse con una arista ponderada (la que lleva la cardinalidad).',
                    node.id, 'ERR: entidad-aristaRelacion'
                );
            }

            if ((edge.type === DEFAULT_EDGE_TYPE || edge.type === OPTIONAL_EDGE_TYPE) && attributeTypes.includes(targetNode.type)) {
                if (targetNode.type === KEY_ATTRIBUTE_TYPE) hasPK = true;
                const attrName = SQLUtils.cleanNames(targetNode).toLowerCase();
                if (attrName) attrNames.push(attrName);
            }
        }

        if (!hasPK && !isChildOfSpecialization) {
            return createMarker('error',
                'Esta entidad no tiene atributo clave (PK). Toda entidad necesita al menos un atributo que identifique de forma única a cada instancia (equivale a la PRIMARY KEY en SQL).',
                node.id, 'ERR: entidad-sinClave'
            );
        }

        // E-5: Duplicate attribute names within entity
        const seen = new Set<string>();
        for (const attrName of attrNames) {
            if (seen.has(attrName)) {
                return createMarker('error',
                    `Esta entidad tiene dos o más atributos con el nombre "${attrName}". Cada atributo debe tener un nombre único dentro de la entidad, ya que en SQL cada columna tiene un nombre distinto.`,
                    node.id, 'ERR: entidad-atributoDuplicado'
                );
            }
            seen.add(attrName);
        }

        return undefined;
    }
}
