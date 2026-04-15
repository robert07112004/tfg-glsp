import { AnyObject, hasArrayProp, hasObjectProp, hasStringProp } from '@eclipse-glsp/server';

// Basic interfaces

export interface ErElement {
    id: string;
    type: string;
}

export interface ErNode extends ErElement {
    name: string;
    position: { x: number; y: number };
    size?: { width: number; height: number };
}

export interface ErEdge extends ErElement {
    sourceId: string;
    targetId: string;
    routingPoints?: { x: number; y: number }[];
}

// Utils

function isErNode(object: any, expectedType: string): boolean {
    return (
        AnyObject.is(object) &&
        hasStringProp(object, 'id') &&
        hasStringProp(object, 'type') && (object as any).type === expectedType &&
        hasStringProp(object, 'name') &&
        hasObjectProp(object, 'position')
    );
}

function isErEdge(object: any, expectedType: string): boolean {
    return (
        AnyObject.is(object) &&
        hasStringProp(object, 'id') &&
        hasStringProp(object, 'type') && (object as any).type === expectedType &&
        hasStringProp(object, 'sourceId') &&
        hasStringProp(object, 'targetId')
    );
}

// ER model

export interface ErModel {
    id: string;
    entities: Entity[];
    weakEntities: WeakEntity[];
    relations: Relation[];
    existenceDependentRelations: ExistenceDependentRelation[];
    identifyingDependentRelations: IdentifyingDependentRelation[];
    partialExclusiveSpecializations: PartialExclusiveSpecialization[];
    totalExclusiveSpecializations: TotalExclusiveSpecialization[];
    partialOverlappedSpecializations: PartialOverlappedSpecialization[];
    totalOverlappedSpecializations: TotalOverlappedSpecialization[];
    attributes: Attribute[];
    multiValuedAttributes: MultiValuedAttribute[];
    derivedAttributes: DerivedAttribute[];
    keyAttributes: KeyAttribute[];
    alternativeKeyAttributes: AlternativeKeyAttribute[];
    transitions: Transition[];
    weightedEdges: WeightedEdge[];
    optionalAttributeEdges: OptionalAttributeEdge[];
    exclusionEdges: ExclusionEdge[];
    inclusionEdges: InclusionEdge[];
    disjointnessEdges: DisjointnessEdge[];
    overlappingEdges: OverlappingEdge[];
}

export namespace ErModel {
    export function is(object: any): object is ErModel {
        return AnyObject.is(object) && hasStringProp(object, 'id') && hasArrayProp(object, 'entities');
    }
}

// Entities

export interface Entity extends ErNode { type: 'entity'; }
export namespace Entity { export const is = (obj: any): obj is Entity => isErNode(obj, 'entity'); }

export interface WeakEntity extends ErNode { type: 'weakEntity'; }
export namespace WeakEntity { export const is = (obj: any): obj is WeakEntity => isErNode(obj, 'weakEntity'); }

// Attributes

export interface Attribute extends ErNode { type: 'attribute'; }
export namespace Attribute { export const is = (obj: any): obj is Attribute => isErNode(obj, 'attribute'); }

export interface KeyAttribute extends ErNode { type: 'keyAttribute'; }
export namespace KeyAttribute { export const is = (obj: any): obj is KeyAttribute => isErNode(obj, 'keyAttribute'); }

export interface AlternativeKeyAttribute extends ErNode { type: 'alternativeKeyAttribute'; }
export namespace AlternativeKeyAttribute { export const is = (obj: any): obj is AlternativeKeyAttribute => isErNode(obj, 'alternativeKeyAttribute'); }

export interface MultiValuedAttribute extends ErNode { type: 'multiValuedAttribute'; }
export namespace MultiValuedAttribute { export const is = (obj: any): obj is MultiValuedAttribute => isErNode(obj, 'multiValuedAttribute'); }

export interface DerivedAttribute extends ErNode {
    type: 'derivedAttribute';
    equation: string;
}
export namespace DerivedAttribute {
    export const is = (obj: any): obj is DerivedAttribute => isErNode(obj, 'derivedAttribute') && hasStringProp(obj, 'equation');
}

// Relations

export interface BaseRelation extends ErNode {
    cardinality: string;
}

export interface Relation extends BaseRelation {
    type: 'relation';
}
export namespace Relation {
    export const is = (obj: any): obj is Relation => isErNode(obj, 'relation') && hasStringProp(obj, 'cardinality');
}

export interface ExistenceDependentRelation extends BaseRelation {
    type: 'existenceDependentRelation';
    dependencyLabel: string;
}
export namespace ExistenceDependentRelation {
    export const is = (obj: any): obj is ExistenceDependentRelation =>
        isErNode(obj, 'existenceDependentRelation') && hasStringProp(obj, 'cardinality') && hasStringProp(obj, 'dependencyLabel');
}

export interface IdentifyingDependentRelation extends BaseRelation {
    type: 'identifyingDependentRelation';
    dependencyLabel: string;
}
export namespace IdentifyingDependentRelation {
    export const is = (obj: any): obj is IdentifyingDependentRelation =>
        isErNode(obj, 'identifyingDependentRelation') && hasStringProp(obj, 'cardinality') && hasStringProp(obj, 'dependencyLabel');
}

// Specializations

export interface PartialExclusiveSpecialization extends ErNode { type: 'partialExclusiveSpecialization'; }
export namespace PartialExclusiveSpecialization { export const is = (obj: any): obj is PartialExclusiveSpecialization => isErNode(obj, 'partialExclusiveSpecialization'); }

export interface TotalExclusiveSpecialization extends ErNode { type: 'totalExclusiveSpecialization'; }
export namespace TotalExclusiveSpecialization { export const is = (obj: any): obj is TotalExclusiveSpecialization => isErNode(obj, 'totalExclusiveSpecialization'); }

export interface PartialOverlappedSpecialization extends ErNode { type: 'partialOverlappedSpecialization'; }
export namespace PartialOverlappedSpecialization { export const is = (obj: any): obj is PartialOverlappedSpecialization => isErNode(obj, 'partialOverlappedSpecialization'); }

export interface TotalOverlappedSpecialization extends ErNode { type: 'totalOverlappedSpecialization'; }
export namespace TotalOverlappedSpecialization { export const is = (obj: any): obj is TotalOverlappedSpecialization => isErNode(obj, 'totalOverlappedSpecialization'); }

// Edges

export interface Transition extends ErEdge { type: 'transition'; }
export namespace Transition { export const is = (obj: any): obj is Transition => isErEdge(obj, 'transition'); }

export interface WeightedEdge extends ErEdge {
    type: 'edge:weighted';
    description: string;
}
export namespace WeightedEdge {
    export const is = (obj: any): obj is WeightedEdge => isErEdge(obj, 'edge:weighted') && hasStringProp(obj, 'description');
}

export interface OptionalAttributeEdge extends ErEdge { type: 'edge:optional'; }
export namespace OptionalAttributeEdge { export const is = (obj: any): obj is OptionalAttributeEdge => isErEdge(obj, 'edge:optional'); }

export interface ExclusionEdge extends ErEdge { type: 'edge:exclusion'; }
export namespace ExclusionEdge { export const is = (obj: any): obj is ExclusionEdge => isErEdge(obj, 'edge:exclusion'); }

export interface InclusionEdge extends ErEdge { type: 'edge:inclusion'; }
export namespace InclusionEdge { export const is = (obj: any): obj is InclusionEdge => isErEdge(obj, 'edge:inclusion'); }

export interface DisjointnessEdge extends ErEdge { type: 'edge:disjointness'; }
export namespace DisjointnessEdge { export const is = (obj: any): obj is DisjointnessEdge => isErEdge(obj, 'edge:disjointness'); }

export interface OverlappingEdge extends ErEdge { type: 'edge:overlap'; }
export namespace OverlappingEdge { export const is = (obj: any): obj is OverlappingEdge => isErEdge(obj, 'edge:overlap'); }