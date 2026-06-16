import { GEdge, GNode, Marker } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ErModelIndex } from '../../../../model/er-model-index';
import { ErModelState } from '../../../../model/er-model-state';
import {
    attributeTypes,
    DEFAULT_EDGE_TYPE,
    entityTypes,
    OPTIONAL_EDGE_TYPE,
    relationTypes,
    specializationTypes,
    WEIGHTED_EDGE_TYPE
} from '../../utils/validation-constants';
import { createMarker } from '../../utils/validation-utils';

/**
 * Validates the direction (source -> target) of every edge. The SQL generator
 * assumes a fixed orientation for each edge type, so an edge drawn backwards
 * would silently produce wrong SQL. This validator reports such edges instead.
 */
@injectable()
export class EdgeDirectionValidator {
    @inject(ErModelState)
    protected readonly modelState!: ErModelState;

    protected get index(): ErModelIndex {
        return this.modelState.index as ErModelIndex;
    }

    validate(edge: GEdge): Marker[] {
        const source = this.index.get(edge.sourceId) as GNode | undefined;
        const target = this.index.get(edge.targetId) as GNode | undefined;

        // Dangling edges are removed by the delete-cascade logic; nothing to check here
        if (!source || !target) return [];

        if (this.isValidDirection(edge.type, source.type, target.type)) return [];

        return [createMarker('error', this.messageFor(edge.type), edge.id, 'ERR: arista-direccionInvalida')];
    }

    private isValidDirection(edgeType: string, sourceType: string, targetType: string): boolean {
        const isEntity = (t: string): boolean => entityTypes.includes(t);
        const isRelation = (t: string): boolean => relationTypes.includes(t);
        const isAttribute = (t: string): boolean => attributeTypes.includes(t);
        const isSpecialization = (t: string): boolean => specializationTypes.includes(t);

        if (edgeType === WEIGHTED_EDGE_TYPE) {
            // entity -> relation/dependency
            return isEntity(sourceType) && isRelation(targetType);
        }

        if (edgeType === OPTIONAL_EDGE_TYPE) {
            // entity/relation -> attribute
            if ((isEntity(sourceType) || isRelation(sourceType)) && isAttribute(targetType)) return true;
            // composite attribute -> sub-attribute
            if (isAttribute(sourceType) && isAttribute(targetType)) return true;
            return false;
        }

        if (edgeType === DEFAULT_EDGE_TYPE) {
            // entity/relation -> attribute
            if ((isEntity(sourceType) || isRelation(sourceType)) && isAttribute(targetType)) return true;
            // supertype -> specialization
            if (isEntity(sourceType) && isSpecialization(targetType)) return true;
            // specialization -> subtype
            if (isSpecialization(sourceType) && isEntity(targetType)) return true;
            // composite attribute -> sub-attribute
            if (isAttribute(sourceType) && isAttribute(targetType)) return true;
            return false;
        }

        // Unknown edge type: do not block
        return true;
    }

    private messageFor(edgeType: string): string {
        if (edgeType === WEIGHTED_EDGE_TYPE) {
            return 'La arista ponderada está dibujada en un sentido no válido. Debe ir desde una entidad hacia una interrelación o dependencia.';
        }
        if (edgeType === OPTIONAL_EDGE_TYPE) {
            return 'La arista opcional está dibujada en un sentido no válido. Debe ir desde una entidad o interrelación hacia un atributo, o desde un atributo compuesto hacia sus subatributos.';
        }
        return 'La transición está dibujada en un sentido no válido. Debe ir desde la entidad o interrelación hacia el atributo, del supertipo hacia la especialización, de la especialización hacia la subentidad, o del atributo compuesto hacia sus subatributos.';
    }
}
