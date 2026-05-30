import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { SQLUtils } from '../../../generator/sql-utils';
import { ErModelIndex } from '../../../../model/er-model-index';
import { ErModelState } from '../../../../model/er-model-state';
import { DEFAULT_EDGE_TYPE, entityTypes } from '../../utils/validation-constants';
import { createMarker } from '../../utils/validation-utils';

@injectable()
export class KeyAttributeValidator {
    @inject(ErModelState)
    protected readonly modelState!: ErModelState;

    protected get index(): ErModelIndex {
        return this.modelState.index as ErModelIndex;
    }

    validate(node: GNode): Marker | undefined {
        const outgoing = this.index.getOutgoingEdges(node);
        const incoming = this.index.getIncomingEdges(node);

        // Rule 1: Not isolated
        if (outgoing.length === 0 && incoming.length === 0) {
            return createMarker('error',
                'Este atributo clave no está conectado a ninguna entidad.',
                node.id, 'ERR: clave-aislada'
            );
        }

        // A-1: Empty name
        const name = SQLUtils.cleanNames(node);
        if (!name) {
            return createMarker('error',
                'El nombre del atributo clave no puede estar vacío. Escribe el nombre del campo que actuará como clave primaria en la tabla (ej: "id", "codigo").',
                node.id, 'ERR: clave-sinNombre'
            );
        }

        // Rule 2: Can only connect via normal transitions; A-3: parent must be an entity
        for (const edge of incoming) {
            if (edge.type !== DEFAULT_EDGE_TYPE) {
                return createMarker('error',
                    'El atributo clave solo puede conectarse mediante aristas normales (transiciones).',
                    node.id, 'ERR: clave-aristaInvalida'
                );
            }

            // A-3: Parent must be an entity type
            const sourceNode = this.index.get(edge.sourceId) as GNode;
            if (!sourceNode || !entityTypes.includes(sourceNode.type)) {
                return createMarker('error',
                    'Los atributos clave (PK) solo pueden pertenecer a entidades. Las interrelaciones no pueden tener clave primaria.',
                    node.id, 'ERR: clave-enRelacion'
                );
            }
        }

        // Rule 4: No outgoing edges (PKs are atomic, no children)
        if (outgoing.length !== 0) {
            return createMarker('error',
                'El atributo clave no puede tener atributos hijos. Las claves primarias son valores atómicos (indivisibles).',
                node.id, 'ERR: clave-conHijos'
            );
        }

        return undefined;
    }
}
