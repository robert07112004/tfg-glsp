import { GEdge, GModelElement, GNode } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { ENTITY_TYPE, RELATION_TYPE } from '../validation/utils/validation-constants';
import { AttributeTransformer } from './sql-attribute-transformer';
import { EntitiesTransformer } from './sql-entities-transformer';
import { NodeData, NodeRegistry } from './sql-interfaces';
import { RelationsTransformer } from './sql-relations-transformer';
import { SQLUtils } from './sql-utils';

@injectable()
export class SQLGenerator {
    private nodeRegistry: NodeRegistry = new Map();
    private processedNodes: Set<string> = new Set();

    public generate(root: GModelElement): string {
        this.nodeRegistry.clear();
        this.processedNodes.clear();
        
        // 1.- Collect all entities and their attributes
        const entityNodes = root.children.filter(child => child.type === ENTITY_TYPE || child.type === RELATION_TYPE) as GNode[];
        for (const node of entityNodes) {
            this.nodeRegistry.set(node.id, {
                name: SQLUtils.cleanNames(node),
                node: node,
                type: node.type,
                attributes: AttributeTransformer.discoverNodeAttributes(node, root)
            });
        }

        // 2.- Generate SQL for each entity
        let sql = "-- Fecha: " + new Date().toLocaleString() + "\n\n";
        
        // 1:1 Relations (both mandatory)
        for (const [id, nodeData] of this.nodeRegistry) {
            const is11 = SQLUtils.getCardinality(nodeData.node) === "1:1";
            if (nodeData.type === RELATION_TYPE && is11) {
                const connectedEdges = root.children.filter(e => e instanceof GEdge && e.targetId === id) as GEdge[];
                if (connectedEdges.length === 2 && SQLUtils.getCardinality(connectedEdges[0]).includes("1..1") && SQLUtils.getCardinality(connectedEdges[1]).includes("1..1")) {
                    const firstEntity = SQLUtils.findById(connectedEdges[0].sourceId, root) as GNode;
                    const secondEntity = SQLUtils.findById(connectedEdges[1].sourceId, root) as GNode;
                    sql += RelationsTransformer.process11RelationBothMandatory(firstEntity, secondEntity, nodeData, root, this.nodeRegistry, this.processedNodes);
                }
            }
        }

        // Entities
        for (const [_, nodeData] of this.nodeRegistry) {
            if (nodeData.type === ENTITY_TYPE && !this.processedNodes.has(nodeData.node.id)) {
                sql += EntitiesTransformer.processEntity(nodeData, root, this.nodeRegistry);
            }
        }

        // N:M Relations
        for (const [id, nodeData] of this.nodeRegistry) {
            const isNM = SQLUtils.getCardinality(nodeData.node) === "N:M";
            if (nodeData.type === RELATION_TYPE && isNM) {
                const connectedEdges = root.children.filter(e => e instanceof GEdge && e.targetId === id) as GEdge[];
                const connectedNodes = connectedEdges.map(edge => this.nodeRegistry.get(edge.sourceId)) as NodeData[];
                sql += RelationsTransformer.processNMrelation(nodeData, connectedNodes, root);
            }
        }

        return sql;
    }

}