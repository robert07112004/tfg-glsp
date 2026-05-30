import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { SQLUtils } from '../../../generator/sql-utils';
import { ErModelIndex } from '../../../../model/er-model-index';
import { ErModelState } from '../../../../model/er-model-state';
import { ATTRIBUTE_TYPE, attributeTypes, DEFAULT_EDGE_TYPE, entityTypes, OPTIONAL_EDGE_TYPE } from '../../utils/validation-constants';
import { createMarker } from '../../utils/validation-utils';

@injectable()
export class AlternativeKeyAttributeValidator {
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
                'Este atributo clave alternativo no está conectado a ninguna entidad.',
                node.id, 'ERR: claveAlternativa-aislada'
            );
        }

        // A-1: Empty name
        const name = SQLUtils.cleanNames(node);
        if (!name) {
            return createMarker('error',
                'El nombre de la clave alternativa no puede estar vacío. Escribe el nombre del campo que actúa como identificador alternativo (ej: "email", "nif").',
                node.id, 'ERR: claveAlternativa-sinNombre'
            );
        }

        // Rule 2: Only normal or optional edges; A-3: parent must be an entity
        for (const edge of incoming) {
            if (edge.type !== DEFAULT_EDGE_TYPE && edge.type !== OPTIONAL_EDGE_TYPE) {
                return createMarker('error',
                    'La clave alternativa solo puede conectarse mediante aristas normales u opcionales.',
                    node.id, 'ERR: claveAlternativa-aristaInvalida'
                );
            }

            // A-3: Parent must be an entity type
            const sourceNode = this.index.get(edge.sourceId) as GNode;
            if (!sourceNode || !entityTypes.includes(sourceNode.type)) {
                return createMarker('error',
                    'Las claves alternativas (CK) solo pueden pertenecer a entidades. Las interrelaciones no pueden tener claves alternativas.',
                    node.id, 'ERR: claveAlternativa-enRelacion'
                );
            }
        }

        // Rule 4: Outgoing edges can only go to normal attributes (for composite AK)
        for (const edge of outgoing) {
            if (edge.type !== DEFAULT_EDGE_TYPE && edge.type !== OPTIONAL_EDGE_TYPE) {
                return createMarker('error',
                    'La clave alternativa solo puede conectarse mediante aristas normales u opcionales.',
                    node.id, 'ERR: claveAlternativa-aristaInvalida'
                );
            }
            const targetNode = this.index.get(edge.targetId) as GNode;
            if (targetNode && attributeTypes.includes(targetNode.type) && targetNode.type !== ATTRIBUTE_TYPE) {
                return createMarker('error',
                    'Una clave alternativa compuesta solo puede tener como hijos atributos normales.',
                    node.id, 'ERR: claveAlternativa-hijoInvalido'
                );
            }
        }

        return undefined;
    }
}
