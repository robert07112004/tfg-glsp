import { GNode } from '@eclipse-glsp/server';

export interface allAttributes {
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