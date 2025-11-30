import { GEdge, GLabel, GModelElement, GNode } from '@eclipse-glsp/server';
import { attributeTypes, ENTITY_TYPE, EXISTENCE_DEP_RELATION_TYPE, IDENTIFYING_DEP_RELATION_TYPE, KEY_ATTRIBUTE_TYPE, RELATION_TYPE, specializationTypes, WEAK_ENTITY_TYPE } from '../validation/utils/validation-constants';
import { SQLFormatter } from './sql-formatter';

// Type Guards
export function isGNode(element: GModelElement): element is GNode { return element instanceof GNode; }
export function isGEdge(element: GModelElement): element is GEdge { return element instanceof GEdge; }
export function isGLabel(element: GModelElement): element is GLabel { return element instanceof GLabel; }

export class ModelUtils {

    static findPrimaryKey(entity: GNode, root: GModelElement): GNode | undefined {
        const attributes = this.findConnectedAttributes(entity, root);
        return attributes.find(attr => attr.type === KEY_ATTRIBUTE_TYPE);
    }

    static getNameFromNode(node: GNode): string | undefined {
        const label = node.children.find(child => isGLabel(child)) as GLabel;
        return label ? label.text : undefined;
    }

    static getCardinality(node: GNode | GEdge): string {
        const label = node.children.find(child => 
            isGLabel(child) && 
            (child.type === 'label:cardinality' || child.id.includes('cardinality') || child.type === 'label:weighted')
        ) as GLabel;
        return label ? label.text : '';
    }

    static findConnectedAttributes(entity: GNode, root: GModelElement): GNode[] {
        return this.findConnectedNodes(entity, root, attributeTypes);
    }

    static findConnectedRelations(entity: GNode, root: GModelElement): GNode[] {
        const rawRelations = this.findConnectedNodes(entity, root, [RELATION_TYPE]);
        const uniqueRelations: GNode[] = [];
        const seenIds = new Set<string>();

        rawRelations.forEach(relation => {
            if (!seenIds.has(relation.id)) {
                seenIds.add(relation.id);
                uniqueRelations.push(relation);
            }
        });

        return uniqueRelations;
    }

    static findConnectedDependenceRelations(weakEntity: GNode, root: GModelElement): GNode[] {
        const allEdges = root.children.filter(isGEdge);
        const incomingEdges = allEdges.filter(edge => edge.targetId === weakEntity.id);
        
        return incomingEdges
            .map(edge => root.children.find(c => c.id === edge.sourceId))
            .filter((node): node is GNode => 
                !!node && isGNode(node) && 
                (node.type === EXISTENCE_DEP_RELATION_TYPE || node.type === IDENTIFYING_DEP_RELATION_TYPE)
            );
    }

    static findConnectedEntities(relation: GNode, root: GModelElement): GNode[] {
        const connected: GNode[] = [];
        const edges = root.children.filter(isGEdge).filter(e => e.sourceId === relation.id || e.targetId === relation.id);
        
        edges.forEach(edge => {
            const targetId = edge.sourceId === relation.id ? edge.targetId : edge.sourceId;
            const node = root.children.find(c => c.id === targetId);
            if (node && isGNode(node) && (node.type === ENTITY_TYPE || node.type === WEAK_ENTITY_TYPE)) {
                connected.push(node);
            }
        });
        return connected;
    }

    static findEdgeBetween(nodeA: GNode, nodeB: GNode, root: GModelElement): GEdge | undefined {
        return root.children.find(el => 
            isGEdge(el) && 
            ((el.sourceId === nodeA.id && el.targetId === nodeB.id) || (el.sourceId === nodeB.id && el.targetId === nodeA.id))
        ) as GEdge | undefined;
    }

    static findOtherEntity(relation: GNode, currentEntity: GNode, root: GModelElement): GNode | undefined {
        const connected = this.findConnectedEntities(relation, root);
        console.log(connected[0].type);
        console.log(connected[1].type);
        return connected.find(e => e.id !== currentEntity.id);
    }

    static findParentFromSpecialization(childEntity: GNode, root: GModelElement): GNode | undefined {
        const allEdges = root.children.filter(isGEdge);
        const incomingEdge = allEdges.find(edge => 
            edge.targetId === childEntity.id && 
            root.children.some(c => c.id === edge.sourceId && specializationTypes.includes(c.type))
        );

        if (incomingEdge) {
            const specializationNode = root.children.find(c => c.id === incomingEdge.sourceId);
            if(specializationNode) {
                const parentEdge = allEdges.find(edge => edge.targetId === specializationNode.id);
                if (parentEdge) {
                    return root.children.find(c => c.id === parentEdge.sourceId) as GNode;
                }
            }
        }
        return undefined;
    }

    private static findConnectedNodes(source: GNode, root: GModelElement, targetTypes: string[]): GNode[] {
        const result: GNode[] = [];
        const edges = root.children.filter(isGEdge).filter(e => e.sourceId === source.id || e.targetId === source.id);
        
        edges.forEach(edge => {
            const otherId = edge.sourceId === source.id ? edge.targetId : edge.sourceId;
            const node = root.children.find(c => c.id === otherId);
            if (node && isGNode(node) && targetTypes.some(t => node.type.includes(t))) {
                result.push(node);
            }
        });
        return result;
    }
    
    static getEquationFromDerivedAttribute(node: GNode): string | undefined {
        const label = node.children.find(c => isGLabel(c) && c.id.includes('equation')) as GLabel;
        return label?.text;
    }

    static getIdentityColumns(entity: GNode, root: GModelElement): { name: string, type: string }[] {
        const columns: { name: string, type: string }[] = [];
        const isWeak = entity.type === WEAK_ENTITY_TYPE;
        if (!isWeak) {
            const pkNode = this.findPrimaryKey(entity, root);
            if (pkNode) {
                const safePkName = SQLFormatter.getSafeName(pkNode);
                const { name, type } = SQLFormatter.splitLabelAttribute(safePkName);
                columns.push({ name, type });
            }
            return columns;
        }
        const dependencyRelations = this.findConnectedDependenceRelations(entity, root);
        for (const relation of dependencyRelations) {
            const parentEntity = this.findOtherEntity(relation, entity, root);
            if (parentEntity) {
                const relationCardinality = this.getCardinality(relation);
                const parentIdentity = this.getIdentityColumns(parentEntity, root);
                parentIdentity.forEach(pid => {
                    const safeParentName = SQLFormatter.getSafeName(parentEntity);
                    columns.push({ 
                        name: `${safeParentName}_${pid.name}`, 
                        type: pid.type 
                    });
                });
                if (!relationCardinality.includes('1:1')) {
                    let partialKeyNode: GNode | undefined;
                    if (relation.type === EXISTENCE_DEP_RELATION_TYPE) {
                        partialKeyNode = this.findPrimaryKey(entity, root);
                    } else if (relation.type === IDENTIFYING_DEP_RELATION_TYPE) {
                        partialKeyNode = this.findPrimaryKey(relation, root);
                    }
                    if (partialKeyNode) {
                        const safePkName = SQLFormatter.getSafeName(partialKeyNode);
                        const { name, type } = SQLFormatter.splitLabelAttribute(safePkName);
                        columns.unshift({ name, type });
                    }
                }
            }
        }
        return columns;
    }

}