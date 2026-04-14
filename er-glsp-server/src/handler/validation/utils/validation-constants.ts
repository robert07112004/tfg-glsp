import {
    DefaultTypes
} from '@eclipse-glsp/server';

export const ENTITY_TYPE = DefaultTypes.NODE_RECTANGLE;
export const WEAK_ENTITY_TYPE = 'node:weakEntity';
export const RELATION_TYPE = DefaultTypes.NODE_DIAMOND;
export const EXISTENCE_DEP_RELATION_TYPE = 'node:existenceDependentRelation';
export const IDENTIFYING_DEP_RELATION_TYPE = 'node:identifyingDependentRelation';
export const PARTIAL_EXCLUSIVE_SPECIALIZATION_TYPE = 'node:partialExclusiveSpecialization';
export const TOTAL_EXCLUSIVE_SPECIALIZATION_TYPE = 'node:totalExclusiveSpecialization';
export const PARTIAL_OVERLAPPED_SPECIALIZATION_TYPE = 'node:partialOverlappedSpecialization';
export const TOTAL_OVERLAPPED_SPECIALIZATION_TYPE = 'node:totalOverlappedSpecialization';

export const entityTypes = [
    ENTITY_TYPE,
    WEAK_ENTITY_TYPE
];

export const relationTypes = [
    RELATION_TYPE,
    EXISTENCE_DEP_RELATION_TYPE,
    IDENTIFYING_DEP_RELATION_TYPE,
];

export const specializationTypes = [
    PARTIAL_EXCLUSIVE_SPECIALIZATION_TYPE,
    TOTAL_EXCLUSIVE_SPECIALIZATION_TYPE,
    PARTIAL_OVERLAPPED_SPECIALIZATION_TYPE,
    TOTAL_OVERLAPPED_SPECIALIZATION_TYPE
]

export const ATTRIBUTE_TYPE = 'node:attribute';
export const KEY_ATTRIBUTE_TYPE = 'node:keyAttribute';
export const MULTI_VALUED_ATTRIBUTE_TYPE = 'node:multiValuedAttribute';
export const DERIVED_ATTRIBUTE_TYPE = 'node:derivedAttribute';
export const ALTERNATIVE_KEY_ATTRIBUTE_TYPE = 'node:alternativeKeyAttribute';

export const attributeTypes = [
    ATTRIBUTE_TYPE,
    KEY_ATTRIBUTE_TYPE,
    MULTI_VALUED_ATTRIBUTE_TYPE,
    DERIVED_ATTRIBUTE_TYPE,
    ALTERNATIVE_KEY_ATTRIBUTE_TYPE
];

export const DEFAULT_EDGE_TYPE = DefaultTypes.EDGE;
export const WEIGHTED_EDGE_TYPE = 'edge:weighted';
export const OPTIONAL_EDGE_TYPE = 'edge:optional';

export const edgeTypes = [
    DEFAULT_EDGE_TYPE,
    WEIGHTED_EDGE_TYPE,
    OPTIONAL_EDGE_TYPE
];

export const MarkerKind = {
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
}