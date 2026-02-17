import { GNode } from '@eclipse-glsp/server';

export interface Multivalued {
    name: string,
    parentName: string,
    parentPKs: { node: GNode, tableName: string, colName: string }[],
    selfNode: GNode[]
}

export interface AllAttributes {
    pk: GNode[];
    unique: { isNullable: boolean, nodes: GNode[] }[];
    simple: GNode[];
    optional: GNode[];
    multiValued: Multivalued[];
    derived?: GNode[];
}

export interface Entity {
    name: string,
    node: GNode,
    type: string,
    attributes: AllAttributes
}

export interface Relation {
    name: string,
    node: GNode,
    type: string,
    cardinality: string,
    isReflexive: boolean,
    connectedEntities: { cardinalityText: string, entity: GNode }[],
    attributes: AllAttributes,
}

export interface Specialization {
    node: GNode,
    type: string,
    father: Entity,
    children: Entity[],
    enum: string,
    discriminator: string
}

export type EntityNodes = Map<string, Entity>;
export type RelationNodes = Map<string, Relation>;
export type SpecializationNodes = Map<string, Specialization>;