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

    validate(node: GNode): Marker | undefined {
        const outgoing = this.index.getOutgoingEdges(node);
        const incoming = this.index.getIncomingEdges(node);

        // Not isolated
        if (incoming.length === 0 && outgoing.length === 0) {
            return createMarker('error',
                'Este atributo no está conectado a ninguna entidad o interrelación.',
                node.id, 'ERR: atributo-aislado'
            );
        }

        // Empty name
        const name = SQLUtils.cleanNames(node);
        if (!name) {
            return createMarker('error',
                'El nombre del atributo no puede estar vacío. Escribe el nombre del campo que representa este atributo en la base de datos (ej: "nombre", "fecha_nacimiento").',
                node.id, 'ERR: atributo-sinNombre'
            );
        }

        // Default name
        if (hasDefaultName(name, 'NewAttribute')) {
            return createMarker('error',
                `"${name.split(':')[0]}" es el nombre por defecto. Asigna un nombre propio a este atributo (ej: "nombre", "fecha_nacimiento").`,
                node.id, 'ERR: atributo-nombreDefault'
            );
        }

        // Only normal or optional edges allowed on incoming
        for (const edge of incoming) {
            if (edge.type !== DEFAULT_EDGE_TYPE && edge.type !== OPTIONAL_EDGE_TYPE) {
                return createMarker('error',
                    'Los atributos solo pueden conectarse mediante aristas normales u opcionales.',
                    node.id, 'ERR: atributo-aristaEntradaInvalida'
                );
            }

            // Cannot connect to specializations
            const sourceNode = this.index.get(edge.sourceId) as GNode;
            if (sourceNode && specializationTypes.includes(sourceNode.type)) {
                return createMarker('error',
                    'Los atributos no pueden estar conectados a especializaciones.',
                    node.id, 'ERR: atributo-padreEspecializacion'
                );
            }
        }

        // Outgoing edges only to same-type attributes (composite attributes)
        for (const edge of outgoing) {
            if (edge.type !== DEFAULT_EDGE_TYPE && edge.type !== OPTIONAL_EDGE_TYPE) {
                return createMarker('error',
                    'Los atributos solo pueden conectarse mediante aristas normales u opcionales.',
                    node.id, 'ERR: atributo-aristaSalidaInvalida'
                );
            }
            const targetNode = this.index.get(edge.targetId) as GNode;
            if (targetNode && attributeTypes.includes(targetNode.type) && targetNode.type !== ATTRIBUTE_TYPE) {
                return createMarker('error',
                    'Un atributo normal compuesto solo puede tener como hijos otros atributos normales.',
                    node.id, 'ERR: atributo-hijoInvalido'
                );
            }
        }

        return undefined;
    }
}
