import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ErModelIndex } from '../../../../model/er-model-index';
import { ErModelState } from '../../../../model/er-model-state';
import { SQLUtils } from '../../../generator/sql-utils';
import { ATTRIBUTE_TYPE, attributeTypes, DEFAULT_EDGE_TYPE, OPTIONAL_EDGE_TYPE, specializationTypes } from '../../utils/validation-constants';
import { createMarker, hasDefaultName } from '../../utils/validation-utils';

@injectable()
export class AttributeValidator {
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
                'Este atributo no está conectado a ninguna entidad o interrelación.',
                node.id, 'ERR: atributo-aislado'
            )];
        }

        // Name: empty / default are mutually exclusive
        const name = SQLUtils.cleanNames(node);
        if (!name) {
            markers.push(createMarker('error',
                'El nombre del atributo no puede estar vacío. Escribe el nombre del campo que representa este atributo en la base de datos (ej: "nombre", "fecha_nacimiento").',
                node.id, 'ERR: atributo-sinNombre'
            ));
        } else if (hasDefaultName(name, 'NewAttribute')) {
            markers.push(createMarker('error',
                `"${name.split(':')[0]}" es el nombre por defecto. Asigna un nombre propio a este atributo (ej: "nombre", "fecha_nacimiento").`,
                node.id, 'ERR: atributo-nombreDefault'
            ));
        }

        // Only normal or optional edges allowed on incoming, no specialization parents
        let inEdgeErrorAdded = false;
        let parentErrorAdded = false;
        for (const edge of incoming) {
            if (!inEdgeErrorAdded && edge.type !== DEFAULT_EDGE_TYPE && edge.type !== OPTIONAL_EDGE_TYPE) {
                markers.push(createMarker('error',
                    'Los atributos solo pueden conectarse mediante aristas normales u opcionales.',
                    node.id, 'ERR: atributo-aristaEntradaInvalida'
                ));
                inEdgeErrorAdded = true;
            }
            const sourceNode = this.index.get(edge.sourceId) as GNode;
            if (!parentErrorAdded && sourceNode && specializationTypes.includes(sourceNode.type)) {
                markers.push(createMarker('error',
                    'Los atributos no pueden estar conectados a especializaciones.',
                    node.id, 'ERR: atributo-padreEspecializacion'
                ));
                parentErrorAdded = true;
            }
        }

        // Outgoing edges only to same-type attributes (composite attributes)
        let outEdgeErrorAdded = false;
        let childErrorAdded = false;
        for (const edge of outgoing) {
            if (!outEdgeErrorAdded && edge.type !== DEFAULT_EDGE_TYPE && edge.type !== OPTIONAL_EDGE_TYPE) {
                markers.push(createMarker('error',
                    'Los atributos solo pueden conectarse mediante aristas normales u opcionales.',
                    node.id, 'ERR: atributo-aristaSalidaInvalida'
                ));
                outEdgeErrorAdded = true;
            }
            const targetNode = this.index.get(edge.targetId) as GNode;
            if (!childErrorAdded && targetNode && attributeTypes.includes(targetNode.type) && targetNode.type !== ATTRIBUTE_TYPE) {
                markers.push(createMarker('error',
                    'Un atributo normal compuesto solo puede tener como hijos otros atributos normales.',
                    node.id, 'ERR: atributo-hijoInvalido'
                ));
                childErrorAdded = true;
            }
        }

        return markers;
    }
}
