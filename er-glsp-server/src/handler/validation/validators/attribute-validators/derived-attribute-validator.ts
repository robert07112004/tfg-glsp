import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ErModelIndex } from '../../../../model/er-model-index';
import { ErModelState } from '../../../../model/er-model-state';
import { SQLUtils } from '../../../generator/sql-utils';
import { DEFAULT_EDGE_TYPE, OPTIONAL_EDGE_TYPE, specializationTypes } from '../../utils/validation-constants';
import { createMarker, hasDefaultName } from '../../utils/validation-utils';

@injectable()
export class DerivedAttributeValidator {
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
                'Este atributo derivado no está conectado a ninguna entidad.',
                node.id, 'ERR: atributoDeriv-aislado'
            )];
        }

        // Name: empty / default are mutually exclusive
        const name = SQLUtils.cleanNames(node);
        if (!name) {
            markers.push(createMarker('error',
                'El nombre del atributo derivado no puede estar vacío. Escribe el nombre del campo calculado (ej: "edad", "total").',
                node.id, 'ERR: atributoDeriv-sinNombre'
            ));
        } else if (hasDefaultName(name, 'NewDerivedAttribute')) {
            markers.push(createMarker('error',
                `"${name.split(':')[0]}" es el nombre por defecto. Asigna un nombre propio a este atributo derivado (ej: "edad", "total").`,
                node.id, 'ERR: atributoDeriv-nombreDefault'
            ));
        }

        // Only normal or optional edges, no specialization parents
        let edgeErrorAdded = false;
        let parentErrorAdded = false;
        for (const edge of incoming) {
            if (!edgeErrorAdded && edge.type !== DEFAULT_EDGE_TYPE && edge.type !== OPTIONAL_EDGE_TYPE) {
                markers.push(createMarker('error',
                    'Los atributos derivados solo pueden conectarse mediante aristas normales u opcionales.',
                    node.id, 'ERR: atributoDeriv-aristaInvalida'
                ));
                edgeErrorAdded = true;
            }
            const sourceNode = this.index.get(edge.sourceId) as GNode;
            if (!parentErrorAdded && sourceNode && specializationTypes.includes(sourceNode.type)) {
                markers.push(createMarker('error',
                    'Los atributos derivados no pueden estar conectados a especializaciones.',
                    node.id, 'ERR: atributoDeriv-padreEspecializacion'
                ));
                parentErrorAdded = true;
            }
        }

        // No children (derived attributes are not composite)
        if (outgoing.length > 0) {
            markers.push(createMarker('error',
                'Un atributo derivado no puede tener atributos hijos. Los atributos derivados son valores calculados a partir de otros datos y no se descomponen.',
                node.id, 'ERR: atributoDeriv-conHijos'
            ));
        }

        return markers;
    }
}
