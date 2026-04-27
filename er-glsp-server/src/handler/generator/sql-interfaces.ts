import { GNode } from '@eclipse-glsp/server';
import { AlternativeKeyAttribute, Attribute, KeyAttribute, MultiValuedAttribute } from '../../model/er-model';

export interface Multivalued {
    name: string,
    parentName: string,
    parentPKs: { node: GNode, tableName: string, colName: string }[],
    selfNode: GNode[]
}

export interface AllAttributes {
    pk: KeyAttribute[];
    unique: AlternativeKeyAttribute[];
    simple: Attribute[];
    optional: Attribute[];
    multiValued: MultiValuedAttribute[];
}

export interface Entity {
    name: string,
    //  node: GNode,
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

export interface PKMapping {
    node: GNode,
    tableName: string,
    colName: string
}

export interface Specialization {
    node: GNode,
    type: string,
    father: Entity,
    children: Entity[],
    enum: string,
    discriminator: string
}

export interface GeneratedTable {
    name: string;
    sql: string;
    dependencies: string[];
}

export type EntityNodes = Map<string, Entity>;
export type RelationNodes = Map<string, Relation>;
export type SpecializationNodes = Map<string, Specialization>;