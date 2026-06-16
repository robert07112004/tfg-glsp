import { GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ErModelIndex } from '../../../../model/er-model-index';
import { ErModelState } from '../../../../model/er-model-state';
import { SQLUtils } from '../../../generator/sql-utils';
import { DEFAULT_EDGE_TYPE, entityTypes } from '../../utils/validation-constants';
import { createMarker, hasDefaultName } from '../../utils/validation-utils';

@injectable()
export class KeyAttributeValidator {
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
        if (outgoing.length === 0 && incoming.length === 0) {
            return [createMarker('error',
                'Este atributo clave no está conectado a ninguna entidad.',
                node.id, 'ERR: clave-aislada'
            )];
        }

        // Name: empty / default are mutually exclusive
        const name = SQLUtils.cleanNames(node);
        if (!name) {
            markers.push(createMarker('error',
                'El nombre del atributo clave no puede estar vacío. Escribe el nombre del campo que actuará como clave primaria en la tabla (ej: "id", "codigo").',
                node.id, 'ERR: clave-sinNombre'
            ));
        } else if (hasDefaultName(name, 'NewKeyAttribute')) {
            markers.push(createMarker('error',
                `"${name.split(':')[0]}" es el nombre por defecto. Asigna un nombre propio a este atributo clave (ej: "id", "codigo").`,
                node.id, 'ERR: clave-nombreDefault'
            ));
        }

        // Can only connect via normal transitions and the parent must be an entity
        let edgeErrorAdded = false;
        let parentErrorAdded = false;
        for (const edge of incoming) {
            if (!edgeErrorAdded && edge.type !== DEFAULT_EDGE_TYPE) {
                markers.push(createMarker('error',
                    'El atributo clave solo puede conectarse mediante aristas normales (transiciones).',
                    node.id, 'ERR: clave-aristaInvalida'
                ));
                edgeErrorAdded = true;
            }
            const sourceNode = this.index.get(edge.sourceId) as GNode;
            if (!parentErrorAdded && (!sourceNode || !entityTypes.includes(sourceNode.type))) {
                markers.push(createMarker('error',
                    'Los atributos clave (PK) solo pueden pertenecer a entidades. Las interrelaciones no pueden tener clave primaria.',
                    node.id, 'ERR: clave-enRelacion'
                ));
                parentErrorAdded = true;
            }
        }

        // No outgoing edges (no children)
        if (outgoing.length !== 0) {
            markers.push(createMarker('error',
                'El atributo clave no puede tener atributos hijos. Las claves primarias son valores atómicos (indivisibles).',
                node.id, 'ERR: clave-conHijos'
            ));
        }

        return markers;
    }
}
