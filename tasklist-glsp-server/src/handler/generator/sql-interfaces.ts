import { GNode } from '@eclipse-glsp/server';

/*export interface allAttributes {
    pk: GNode[];
    unique: { isNullable: boolean, nodes: GNode[] }[];
    simple: GNode[];
    optional: GNode[];
    multiValued: { name: string, nodes: GNode[] }[];
    derived: GNode[];
}

export interface NodeData {
    node: GNode;
    name: string;
    type: string;
    attributes: allAttributes;
}

export type NodeRegistry = Map<string, NodeData>;

export interface TableContext {
    columns: string[];
    tableConstraints: { primaryKeys: string[], compositeUnique: string[], pksFromDiamond: string[], foreignKeys: string[]};
    pksForMultivalued: { node: GNode, prefix: string }[];
}*/

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

export type EntityNodes = Map<string, Entity>
export type RelationNodes = Map<string, Relation>