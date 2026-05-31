import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ErModelIndex } from '../../../../model/er-model-index';
import { ErModelState } from '../../../../model/er-model-state';
import { DEFAULT_EDGE_TYPE, ENTITY_TYPE, entityTypes } from '../../utils/validation-constants';
import { createMarker } from '../../utils/validation-utils';

@injectable()
export class AllSpecializationsValidator {
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
                'Esta especialización no está conectada a nada. Debe tener una entidad padre y al menos dos entidades subclase.',
                node.id, 'ERR: especializacion-aislada'
            );
        }

        // Only normal edges allowed (no weighted or optional)
        for (const edge of incoming) {
            if (edge.type !== DEFAULT_EDGE_TYPE) {
                return createMarker('error',
                    'La conexión entre la entidad padre y la especialización debe ser una arista normal.',
                    node.id, 'ERR: especializacion-aristaEntradaInvalida'
                );
            }
        }

        for (const edge of outgoing) {
            if (edge.type !== DEFAULT_EDGE_TYPE) {
                return createMarker('error',
                    'Las conexiones entre la especialización y las subclases deben ser aristas normales.',
                    node.id, 'ERR: especializacion-aristaSalidaInvalida'
                );
            }
        }

        // Exactly one parent entity
        if (incoming.length !== 1) {
            return createMarker('error',
                `Una especialización debe tener exactamente una entidad padre. ${incoming.length === 0 ? 'Falta conectar la entidad padre.' : 'Tiene más de una entidad padre.'}`,
                node.id, 'ERR: especializacion-padreInvalido'
            );
        }

        const parentNode = this.index.get(incoming[0].sourceId) as GNode;
        if (!parentNode || !entityTypes.includes(parentNode.type)) {
            return createMarker('error',
                'El padre de una especialización debe ser una entidad.',
                node.id, 'ERR: especializacion-padreNoEntidad'
            );
        }

        // Parent cannot also be a subclass in the same specialization
        const childIds = new Set(outgoing.map(e => e.targetId));
        if (childIds.has(incoming[0].sourceId)) {
            return createMarker('error',
                'La entidad padre de esta especialización no puede ser también una de sus subclases.',
                node.id, 'ERR: especializacion-padreTambienHijo'
            );
        }

        // All outgoing targets must be entities
        for (const edge of outgoing) {
            const targetNode = this.index.get(edge.targetId) as GNode;
            if (!targetNode || targetNode.type !== ENTITY_TYPE) {
                return createMarker('error',
                    'Las subclases de una especialización deben ser entidades normales.',
                    node.id, 'ERR: especializacion-hijoNoEntidad'
                );
            }
        }

        // At least 2 subclasses
        if (outgoing.length < 2) {
            return createMarker('error',
                'Una especialización debe tener al menos dos subclases (entidades hijas). Con una sola subclase no tiene sentido dividir la entidad.',
                node.id, 'ERR: especializacion-pocasSubclases'
            );
        }

        // No duplicate subclasses
        const seenChildIds = new Set<string>();
        for (const edge of outgoing) {
            if (seenChildIds.has(edge.targetId)) {
                return createMarker('error',
                    'La misma entidad aparece dos veces como subclase en esta especialización. Cada subclase debe ser una entidad distinta.',
                    node.id, 'ERR: especializacion-subclaseDuplicada'
                );
            }
            seenChildIds.add(edge.targetId);
        }

        return undefined;
    }
}
