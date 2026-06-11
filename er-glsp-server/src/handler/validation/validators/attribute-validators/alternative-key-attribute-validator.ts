import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ErModelIndex } from '../../../../model/er-model-index';
import { ErModelState } from '../../../../model/er-model-state';
import { SQLUtils } from '../../../generator/sql-utils';
import { ALTERNATIVE_KEY_ATTRIBUTE_TYPE, ATTRIBUTE_TYPE, attributeTypes, DEFAULT_EDGE_TYPE, entityTypes, OPTIONAL_EDGE_TYPE } from '../../utils/validation-constants';
import { createMarker, hasDefaultName } from '../../utils/validation-utils';

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

        // Not isolated
        if (incoming.length === 0 && outgoing.length === 0) {
            return createMarker('error',
                'Este atributo clave alternativo no está conectado a ninguna entidad.',
                node.id, 'ERR: claveAlternativa-aislada'
            );
        }

        // Empty name
        const name = SQLUtils.cleanNames(node);
        if (!name) {
            return createMarker('error',
                'El nombre de la clave alternativa no puede estar vacío. Escribe el nombre del campo que actúa como identificador alternativo (ej: "email", "nif").',
                node.id, 'ERR: claveAlternativa-sinNombre'
            );
        }

        // Default name
        if (hasDefaultName(name, 'NewAlternativeKeyAttribute')) {
            return createMarker('error',
                `"${name.split(':')[0]}" es el nombre por defecto. Asigna un nombre propio a esta clave alternativa (ej: "email", "nif").`,
                node.id, 'ERR: claveAlternativa-nombreDefault'
            );
        }

        // Only normal or optional edges
        for (const edge of incoming) {
            if (edge.type !== DEFAULT_EDGE_TYPE && edge.type !== OPTIONAL_EDGE_TYPE) {
                return createMarker('error',
                    'La clave alternativa solo puede conectarse mediante aristas normales u opcionales.',
                    node.id, 'ERR: claveAlternativa-aristaInvalida'
                );
            }

            // Parent must be an entity type
            const sourceNode = this.index.get(edge.sourceId) as GNode;
            if (!sourceNode || !entityTypes.includes(sourceNode.type)) {
                return createMarker('error',
                    'Las claves alternativas (CK) solo pueden pertenecer a entidades. Las interrelaciones no pueden tener claves alternativas.',
                    node.id, 'ERR: claveAlternativa-enRelacion'
                );
            }
        }

        // Outgoing edges can only go to normal and AK attributes (for composite AK)
        for (const edge of outgoing) {
            if (edge.type !== DEFAULT_EDGE_TYPE && edge.type !== OPTIONAL_EDGE_TYPE) {
                return createMarker('error',
                    'La clave alternativa solo puede conectarse mediante aristas normales u opcionales.',
                    node.id, 'ERR: claveAlternativa-aristaInvalida'
                );
            }
            const targetNode = this.index.get(edge.targetId) as GNode;
            if (targetNode && attributeTypes.includes(targetNode.type) &&
                targetNode.type !== ATTRIBUTE_TYPE && targetNode.type !== ALTERNATIVE_KEY_ATTRIBUTE_TYPE) {
                return createMarker('error',
                    'Una clave alternativa compuesta solo puede tener como hijos atributos normales o claves alternativas.',
                    node.id, 'ERR: claveAlternativa-hijoInvalido'
                );
            }
        }

        return undefined;
    }
}
