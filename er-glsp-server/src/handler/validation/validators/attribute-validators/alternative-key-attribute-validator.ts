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

    validate(node: GNode): Marker[] {
        const markers: Marker[] = [];
        const outgoing = this.index.getOutgoingEdges(node);
        const incoming = this.index.getIncomingEdges(node);

        // An isolated node does not allow checking the rest of the rules
        if (incoming.length === 0 && outgoing.length === 0) {
            return [createMarker('error',
                'Este atributo clave alternativo no está conectado a ninguna entidad.',
                node.id, 'ERR: claveAlternativa-aislada'
            )];
        }

        // Name: empty / default are mutually exclusive
        const name = SQLUtils.cleanNames(node);
        if (!name) {
            markers.push(createMarker('error',
                'El nombre de la clave alternativa no puede estar vacío. Escribe el nombre del campo que actúa como identificador alternativo (ej: "email", "nif").',
                node.id, 'ERR: claveAlternativa-sinNombre'
            ));
        } else if (hasDefaultName(name, 'NewAlternativeKeyAttribute')) {
            markers.push(createMarker('error',
                `"${name.split(':')[0]}" es el nombre por defecto. Asigna un nombre propio a esta clave alternativa (ej: "email", "nif").`,
                node.id, 'ERR: claveAlternativa-nombreDefault'
            ));
        }

        // Only normal or optional edges, the parent must be an entity
        let inEdgeErrorAdded = false;
        let parentErrorAdded = false;
        for (const edge of incoming) {
            if (!inEdgeErrorAdded && edge.type !== DEFAULT_EDGE_TYPE && edge.type !== OPTIONAL_EDGE_TYPE) {
                markers.push(createMarker('error',
                    'La clave alternativa solo puede conectarse mediante aristas normales u opcionales.',
                    node.id, 'ERR: claveAlternativa-aristaInvalida'
                ));
                inEdgeErrorAdded = true;
            }
            const sourceNode = this.index.get(edge.sourceId) as GNode;
            if (!parentErrorAdded && (!sourceNode || !entityTypes.includes(sourceNode.type))) {
                markers.push(createMarker('error',
                    'Las claves alternativas (CK) solo pueden pertenecer a entidades. Las interrelaciones no pueden tener claves alternativas.',
                    node.id, 'ERR: claveAlternativa-enRelacion'
                ));
                parentErrorAdded = true;
            }
        }

        // Outgoing edges can only go to normal and AK attributes (for composite AK)
        let outEdgeErrorAdded = false;
        let childErrorAdded = false;
        for (const edge of outgoing) {
            if (!outEdgeErrorAdded && edge.type !== DEFAULT_EDGE_TYPE && edge.type !== OPTIONAL_EDGE_TYPE) {
                markers.push(createMarker('error',
                    'La clave alternativa solo puede conectarse mediante aristas normales u opcionales.',
                    node.id, 'ERR: claveAlternativa-aristaInvalida'
                ));
                outEdgeErrorAdded = true;
            }
            const targetNode = this.index.get(edge.targetId) as GNode;
            if (!childErrorAdded && targetNode && attributeTypes.includes(targetNode.type) &&
                targetNode.type !== ATTRIBUTE_TYPE && targetNode.type !== ALTERNATIVE_KEY_ATTRIBUTE_TYPE) {
                markers.push(createMarker('error',
                    'Una clave alternativa compuesta solo puede tener como hijos atributos normales o claves alternativas.',
                    node.id, 'ERR: claveAlternativa-hijoInvalido'
                ));
                childErrorAdded = true;
            }
        }

        return markers;
    }
}
