import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { SQLUtils } from '../../../generator/sql-utils';
import { ErModelIndex } from '../../../../model/er-model-index';
import { ErModelState } from '../../../../model/er-model-state';
import { DEFAULT_EDGE_TYPE, EXISTENCE_DEP_RELATION_TYPE, IDENTIFYING_DEP_RELATION_TYPE, OPTIONAL_EDGE_TYPE, specializationTypes } from '../../utils/validation-constants';
import { createMarker } from '../../utils/validation-utils';

@injectable()
export class MultiValuedAttributeValidator {
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
                'Este atributo multivaluado no está conectado a ninguna entidad.',
                node.id, 'ERR: atributoMultiv-aislado'
            );
        }

        // A-1: Empty name
        const name = SQLUtils.cleanNames(node);
        if (!name) {
            return createMarker('error',
                'El nombre del atributo multivaluado no puede estar vacío. Escribe el nombre del campo que puede tener múltiples valores (ej: "telefonos", "emails").',
                node.id, 'ERR: atributoMultiv-sinNombre'
            );
        }

        // Rule 2: Only normal or optional edges; Rule 3: no specializations or dependence relations
        for (const edge of incoming) {
            if (edge.type !== DEFAULT_EDGE_TYPE && edge.type !== OPTIONAL_EDGE_TYPE) {
                return createMarker('error',
                    'Los atributos multivaluados solo pueden conectarse mediante aristas normales u opcionales.',
                    node.id, 'ERR: atributoMultiv-aristaInvalida'
                );
            }
            const sourceNode = this.index.get(edge.sourceId) as GNode;
            if (sourceNode && (specializationTypes.includes(sourceNode.type) ||
                sourceNode.type === IDENTIFYING_DEP_RELATION_TYPE ||
                sourceNode.type === EXISTENCE_DEP_RELATION_TYPE)) {
                return createMarker('error',
                    'Los atributos multivaluados no pueden conectarse a especializaciones ni a dependencias.',
                    node.id, 'ERR: atributoMultiv-padreInvalido'
                );
            }
        }

        // Rule 4: Outgoing edges must use normal or optional edges
        for (const edge of outgoing) {
            if (edge.type !== DEFAULT_EDGE_TYPE && edge.type !== OPTIONAL_EDGE_TYPE) {
                return createMarker('error',
                    'Los atributos multivaluados solo pueden conectarse mediante aristas normales u opcionales.',
                    node.id, 'ERR: atributoMultiv-aristaInvalida'
                );
            }
        }

        return undefined;
    }
}
