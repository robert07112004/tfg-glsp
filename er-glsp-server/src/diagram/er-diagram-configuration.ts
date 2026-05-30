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
        const relationTypes = [
            DefaultTypes.NODE_DIAMOND,
            'node:existenceDependentRelation',
            'node:identifyingDependentRelation',
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

        const allMainNodes = [...entityTypes, ...relationTypes, ...attributeTypes];

        const defaultEdgeConfig = {
            deletable: true,
            repositionable: true,
            routable: true,
            sourceElementTypeIds: allMainNodes,
            targetElementTypeIds: allMainNodes
        };

        return [
            { elementTypeId: DefaultTypes.EDGE, ...defaultEdgeConfig },
            { elementTypeId: 'edge:weighted', ...defaultEdgeConfig },
            { elementTypeId: 'edge:optional', ...defaultEdgeConfig },
        ];
    }
}
