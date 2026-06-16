import {
    DefaultTypes,
    DiagramConfiguration,
    EdgeTypeHint,
    getDefaultMapping,
    GModelElement,
    GModelElementConstructor,
    ServerLayoutKind,
    ShapeTypeHint
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';

@injectable()
export class ErDiagramConfiguration implements DiagramConfiguration {
    layoutKind = ServerLayoutKind.MANUAL;
    needsClientLayout = true;
    animatedUpdate = true;

    get typeMapping(): Map<string, GModelElementConstructor<GModelElement>> {
        return getDefaultMapping();
    }

    get shapeTypeHints(): ShapeTypeHint[] {
        const defaultShapeConfig = {
            deletable: true,
            reparentable: false,
            repositionable: true,
            resizable: true
        };

        const standardNodes = [
            DefaultTypes.NODE_RECTANGLE,
            'node:weakEntity',
            DefaultTypes.NODE_DIAMOND,
            'node:existenceDependentRelation',
            'node:identifyingDependentRelation',
            'node:partialExclusiveSpecialization',
            'node:totalExclusiveSpecialization',
            'node:partialOverlappedSpecialization',
            'node:totalOverlappedSpecialization',
            'node:attribute',
            'node:multiValuedAttribute',
            'node:derivedAttribute',
            'node:keyAttribute',
            'node:alternativeKeyAttribute'
        ];

        const hints: ShapeTypeHint[] = standardNodes.map(typeId => ({
            elementTypeId: typeId,
            ...defaultShapeConfig
        }));

        return hints;
    }

    get edgeTypeHints(): EdgeTypeHint[] {
        const entityTypes = [DefaultTypes.NODE_RECTANGLE, 'node:weakEntity'];
        const relationDependencyTypes = [
            DefaultTypes.NODE_DIAMOND,
            'node:existenceDependentRelation',
            'node:identifyingDependentRelation'
        ];
        const specializationTypes = [
            'node:partialExclusiveSpecialization',
            'node:totalExclusiveSpecialization',
            'node:partialOverlappedSpecialization',
            'node:totalOverlappedSpecialization'
        ];
        const attributeTypes = [
            'node:attribute',
            'node:keyAttribute',
            'node:multiValuedAttribute',
            'node:derivedAttribute',
            'node:alternativeKeyAttribute'
        ];

        const baseEdgeConfig = { deletable: true, repositionable: true, routable: true };

        return [
            {
                elementTypeId: DefaultTypes.EDGE,
                ...baseEdgeConfig,
                sourceElementTypeIds: [...entityTypes, ...relationDependencyTypes, ...specializationTypes],
                targetElementTypeIds: [...attributeTypes, ...specializationTypes, ...entityTypes]
            },
            {
                elementTypeId: 'edge:weighted',
                ...baseEdgeConfig,
                sourceElementTypeIds: entityTypes,
                targetElementTypeIds: relationDependencyTypes
            },
            {
                elementTypeId: 'edge:optional',
                ...baseEdgeConfig,
                sourceElementTypeIds: [...entityTypes, ...relationDependencyTypes],
                targetElementTypeIds: attributeTypes
            }
        ];
    }
}
