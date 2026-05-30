import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { SQLUtils } from '../../../generator/sql-utils';
import { ErModelIndex } from '../../../../model/er-model-index';
import { ErModelState } from '../../../../model/er-model-state';
import { DEFAULT_EDGE_TYPE, OPTIONAL_EDGE_TYPE, specializationTypes } from '../../utils/validation-constants';
import { createMarker } from '../../utils/validation-utils';

@injectable()
export class DerivedAttributeValidator {
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
                'Este atributo derivado no está conectado a ninguna entidad.',
                node.id, 'ERR: atributoDeriv-aislado'
            );
        }

        // A-1: Empty name
        const name = SQLUtils.cleanNames(node);
        if (!name) {
            return createMarker('error',
                'El nombre del atributo derivado no puede estar vacío. Escribe el nombre del campo calculado (ej: "edad", "total").',
                node.id, 'ERR: atributoDeriv-sinNombre'
            );
        }

        // Rule 2: Only normal or optional edges; Rule 3: no specialization parents
        for (const edge of incoming) {
            if (edge.type !== DEFAULT_EDGE_TYPE && edge.type !== OPTIONAL_EDGE_TYPE) {
                return createMarker('error',
                    'Los atributos derivados solo pueden conectarse mediante aristas normales u opcionales.',
                    node.id, 'ERR: atributoDeriv-aristaInvalida'
                );
            }
            const sourceNode = this.index.get(edge.sourceId) as GNode;
            if (sourceNode && specializationTypes.includes(sourceNode.type)) {
                return createMarker('error',
                    'Los atributos derivados no pueden estar conectados a especializaciones.',
                    node.id, 'ERR: atributoDeriv-padreEspecializacion'
                );
            }
        }

        // Rule 4: No children (derived attributes are not composite)
        if (outgoing.length > 0) {
            return createMarker('error',
                'Un atributo derivado no puede tener atributos hijos. Los atributos derivados son valores calculados a partir de otros datos y no se descomponen.',
                node.id, 'ERR: atributoDeriv-conHijos'
            );
        }

        return undefined;
    }
}
