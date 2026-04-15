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

        hints.push({
            elementTypeId: 'port:constraint',
            deletable: false,
            reparentable: false,
            repositionable: false,
            resizable: false
        });

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
        const entityAndRelations = [...entityTypes, ...relationTypes];

        const defaultEdgeConfig = {
            deletable: true,
            repositionable: true,
            routable: true,
            sourceElementTypeIds: allMainNodes,
            targetElementTypeIds: allMainNodes
        };

        const constraintEdgeConfig = {
            deletable: true,
            repositionable: false,
            routable: false,
            sourceElementTypeIds: entityAndRelations,
            targetElementTypeIds: entityAndRelations
        };

        const portOnlyConfig = {
            deletable: true,
            repositionable: false,
            routable: false,
            sourceElementTypeIds: ['port:constraint'],
            targetElementTypeIds: ['port:constraint']
        };

        return [
            {
                elementTypeId: DefaultTypes.EDGE,
                deletable: true,
                repositionable: true,
                routable: true,
                sourceElementTypeIds: [DefaultTypes.NODE],
                targetElementTypeIds: [DefaultTypes.NODE]
            },
            { elementTypeId: 'edge:weighted', ...defaultEdgeConfig },
            { elementTypeId: 'edge:optional', ...defaultEdgeConfig },
            { elementTypeId: 'edge:exclusion', ...constraintEdgeConfig },
            { elementTypeId: 'edge:inclusion', ...constraintEdgeConfig, sourceElementTypeIds: allMainNodes, targetElementTypeIds: allMainNodes },
            { elementTypeId: 'edge:disjointness', ...portOnlyConfig },
            { elementTypeId: 'edge:overlap', ...portOnlyConfig }
        ];
    }
}
