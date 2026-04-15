import { DefaultTypes, GEdge, GGraph, GLabel, GModelFactory, GNode, GPort } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { AlternativeKeyAttribute, Attribute, DerivedAttribute, DisjointnessEdge, Entity, ErEdge, ErNode, ExclusionEdge, ExistenceDependentRelation, IdentifyingDependentRelation, InclusionEdge, KeyAttribute, MultiValuedAttribute, OptionalAttributeEdge, OverlappingEdge, PartialExclusiveSpecialization, PartialOverlappedSpecialization, Relation, TotalExclusiveSpecialization, TotalOverlappedSpecialization, Transition, WeakEntity, WeightedEdge } from './er-model';
import { ErModelState } from './er-model-state';

@injectable()
export class ErGModelFactory implements GModelFactory {
    @inject(ErModelState)
    protected modelState: ErModelState;

    createModel(): void {
        const erModel = this.modelState.sourceModel;
        this.modelState.index.indexErModel(erModel);

        const childNodes = [
            ...(erModel.entities || []).map(e => this.createEntityNode(e)),
            ...(erModel.weakEntities || []).map(we => this.createWeakEntityNode(we)),
            ...(erModel.relations || []).map(r => this.createRelationNode(r, erModel.weightedEdges || [])),
            ...(erModel.existenceDependentRelations || []).map(edr => this.createExistenceDependentRelationNode(edr, erModel.weightedEdges || [])),
            ...(erModel.identifyingDependentRelations || []).map(idr => this.createIdentifyingDependentRelationNode(idr, erModel.weightedEdges || [])),
            ...(erModel.partialExclusiveSpecializations || []).map(pes => this.createPartialExclusiveSpecializationNode(pes)),
            ...(erModel.totalExclusiveSpecializations || []).map(tes => this.createTotalExclusiveSpecializationNode(tes)),
            ...(erModel.partialOverlappedSpecializations || []).map(pos => this.createPartialOverlappedSpecializationNode(pos)),
            ...(erModel.totalOverlappedSpecializations || []).map(tos => this.createTotalOverlappedSpecializationNode(tos)),
            ...(erModel.attributes || []).map(a => this.createAttributeNode(a)),
            ...(erModel.multiValuedAttributes || []).map(mva => this.createMultiValuedAttributeNode(mva)),
            ...(erModel.derivedAttributes || []).map(da => this.createDerivedAttributeNode(da)),
            ...(erModel.keyAttributes || []).map(ka => this.createKeyAttributeNode(ka)),
            ...(erModel.alternativeKeyAttributes || []).map(aka => this.createAlternativeKeyAttributeNode(aka))
        ];

        const childEdges = [
            ...(erModel.transitions || []).map(t => this.createTransitionEdge(t)),
            ...(erModel.weightedEdges || []).map(we => this.createWeightedEdge(we)),
            ...(erModel.optionalAttributeEdges || []).map(oae => this.createOptionalAttributeEdge(oae)),
            ...(erModel.exclusionEdges || []).map(e => this.createExclusionEdge(e)),
            ...(erModel.inclusionEdges || []).map(ie => this.createInclusionEdge(ie)),
            ...(erModel.disjointnessEdges || []).map(de => this.createDisjointnessEdge(de)),
            ...(erModel.overlappingEdges || []).map(oe => this.createOverlappingEdge(oe))
        ]

        this.updatePortPositions(childEdges, childNodes);

        const newRoot = GGraph.builder()
            .id(erModel.id)
            .addChildren(childNodes)
            .addChildren(childEdges)
            .build();
        this.modelState.updateRoot(newRoot);
    }

    // Helpers

    private createBaseNodeBuilder(node: ErNode, type: string, cssClass: string, defaultWidth: number, defaultHeight: number) {
        const builder = GNode.builder()
            .id(node.id)
            .type(type)
            .addCssClass(cssClass)
            .layout('vbox')
            .addLayoutOption('hAlign', 'center')
            .addLayoutOption('vAlign', 'middle')
            .position(node.position);

        if (node.size) {
            builder.addLayoutOptions({ prefWidth: node.size.width, prefHeight: node.size.height });
        } else {
            builder.addLayoutOptions({ prefWidth: defaultWidth, prefHeight: defaultHeight });
        }
        return builder;
    }

    private createBaseEdgeBuilder(edge: ErEdge, type: string | undefined, cssClass: string) {
        const builder = GEdge.builder()
            .id(edge.id)
            .addCssClass(cssClass)
            .sourceId(edge.sourceId)
            .targetId(edge.targetId)
            .addRoutingPoints(edge.routingPoints || []);

        if (type) builder.type(type);
        return builder;
    }

    private createLabel(id: string, text: string, type?: string, cssClass?: string) {
        const builder = GLabel.builder().id(id).text(text);
        if (type) builder.type(type);
        if (cssClass) builder.addCssClass(cssClass);
        return builder.build();
    }

    // Entities

    protected createEntityNode(entity: Entity): GNode {
        return this.createBaseNodeBuilder(entity, DefaultTypes.NODE_RECTANGLE, 'entity-node', 100, 40)
            .add(this.createLabel(`${entity.id}_label`, entity.name))
            .build();
    }

    protected createWeakEntityNode(weakEntity: WeakEntity): GNode {
        return this.createBaseNodeBuilder(weakEntity, 'node:weakEntity', 'weak-entity-node', 100, 40)
            .add(this.createLabel(`${weakEntity.id}_label`, weakEntity.name))
            .build();
    }

    // Attributes

    protected createAttributeNode(attribute: Attribute): GNode {
        return this.createBaseNodeBuilder(attribute, 'node:attribute', 'attribute-node', 100, 40)
            .add(this.createLabel(`${attribute.id}_label`, attribute.name))
            .build();
    }

    protected createKeyAttributeNode(attribute: KeyAttribute): GNode {
        return this.createBaseNodeBuilder(attribute, 'node:keyAttribute', 'key-attribute-node', 100, 40)
            .add(this.createLabel(`${attribute.id}_label`, attribute.name, undefined, 'key-attribute-label'))
            .build();
    }

    protected createAlternativeKeyAttributeNode(attribute: AlternativeKeyAttribute): GNode {
        return this.createBaseNodeBuilder(attribute, 'node:alternativeKeyAttribute', 'alternative-key-attribute-node', 100, 40)
            .add(this.createLabel(`${attribute.id}_label`, attribute.name, undefined, 'alternative-key-attribute-label'))
            .build();
    }

    protected createMultiValuedAttributeNode(attribute: MultiValuedAttribute): GNode {
        return this.createBaseNodeBuilder(attribute, 'node:multiValuedAttribute', 'multi-valued-attribute-node', 100, 40)
            .add(this.createLabel(`${attribute.id}_label`, attribute.name))
            .build();
    }

    protected createDerivedAttributeNode(attribute: DerivedAttribute): GNode {
        return this.createBaseNodeBuilder(attribute, 'node:derivedAttribute', 'derived-attribute-node', 100, 40)
            .add(this.createLabel(`${attribute.id}_label`, attribute.name))
            .add(this.createLabel(`${attribute.id}_equation_label`, attribute.equation))
            .build();
    }

    // Relations

    protected createRelationNode(relation: Relation, weightedEdges: WeightedEdge[]): GNode {
        return this.createBaseNodeBuilder(relation, DefaultTypes.NODE_DIAMOND, 'relation-node', 60, 60)
            .addLayoutOption('paddingTop', 15).addLayoutOption('paddingBottom', 15)
            .addLayoutOption('paddingLeft', 20).addLayoutOption('paddingRight', 20)
            .add(this.createLabel(`${relation.id}_label`, relation.name))
            .add(this.createLabel(`${relation.id}_cardinality_label`, this.computeCardinality(weightedEdges, relation.id), 'label:cardinality', 'cardinality-label'))
            .build();
    }

    protected createExistenceDependentRelationNode(relation: ExistenceDependentRelation, weightedEdges: WeightedEdge[]): GNode {
        return this.createBaseNodeBuilder(relation, 'node:existenceDependentRelation', 'existence-dependent-relation-node', 60, 60)
            .add(this.createLabel(`${relation.id}_existence_label`, 'E', 'label:static', 'existence-label'))
            .add(this.createLabel(`${relation.id}_label`, relation.name))
            .add(this.createLabel(`${relation.id}_cardinality_label`, this.computeCardinality(weightedEdges, relation.id), 'label:cardinality', 'cardinality-label'))
            .build();
    }

    protected createIdentifyingDependentRelationNode(relation: IdentifyingDependentRelation, weightedEdges: WeightedEdge[]): GNode {
        return this.createBaseNodeBuilder(relation, 'node:identifyingDependentRelation', 'existence-dependent-relation-node', 60, 60)
            .add(this.createLabel(`${relation.id}_identifying_label`, 'Id', 'label:static', 'existence-label'))
            .add(this.createLabel(`${relation.id}_label`, relation.name))
            .add(this.createLabel(`${relation.id}_cardinality_label`, this.computeCardinality(weightedEdges, relation.id), 'label:cardinality', 'cardinality-label'))
            .build();
    }

    // Specializations

    protected createPartialExclusiveSpecializationNode(spec: PartialExclusiveSpecialization): GNode {
        return this.createBaseNodeBuilder(spec, 'node:partialExclusiveSpecialization', 'partial-exclusive-specialization-node', 60, 60)
            .add(this.createLabel(`${spec.id}_label`, 'Partial Exclusive', 'label:static', 'existence-label'))
            .build();
    }

    protected createTotalExclusiveSpecializationNode(spec: TotalExclusiveSpecialization): GNode {
        return this.createBaseNodeBuilder(spec, 'node:totalExclusiveSpecialization', 'total-exclusive-specialization-node', 60, 60)
            .add(this.createLabel(`${spec.id}_label`, 'Total Exclusive', 'label:static', 'existence-label'))
            .build();
    }

    protected createPartialOverlappedSpecializationNode(spec: PartialOverlappedSpecialization): GNode {
        return this.createBaseNodeBuilder(spec, 'node:partialOverlappedSpecialization', 'partial-overlapped-specialization-node', 60, 60)
            .add(this.createLabel(`${spec.id}_label`, 'Partial Overlapped', 'label:static', 'existence-label'))
            .build();
    }

    protected createTotalOverlappedSpecializationNode(spec: TotalOverlappedSpecialization): GNode {
        return this.createBaseNodeBuilder(spec, 'node:totalOverlappedSpecialization', 'total-overlapped-specialization-node', 60, 60)
            .add(this.createLabel(`${spec.id}_label`, 'Total Overlapped', 'label:static', 'existence-label'))
            .build();
    }

    // Edges

    protected createTransitionEdge(transition: Transition): GEdge {
        return this.createBaseEdgeBuilder(transition, undefined, 'tasklist-transition').build();
    }

    protected createWeightedEdge(weightedEdge: WeightedEdge): GEdge {
        return this.createBaseEdgeBuilder(weightedEdge, 'edge:weighted', 'weighted-edge')
            .add(this.createLabel(`${weightedEdge.id}_label`, weightedEdge.description ?? '', 'label:weighted', 'weighted-edge-label'))
            .add(GPort.builder().id(`${weightedEdge.id}_port`).type('port:constraint').build())
            .build();
    }

    protected createOptionalAttributeEdge(edge: OptionalAttributeEdge): GEdge {
        return this.createBaseEdgeBuilder(edge, 'edge:optional', 'optional-attribute-edge').build();
    }

    protected createExclusionEdge(edge: ExclusionEdge): GEdge {
        return this.createBaseEdgeBuilder(edge, 'edge:exclusion', 'exclusion-edge')
            .add(this.createLabel(`${edge.id}_label`, 'Exclusion', 'label:static', 'exclusion-label'))
            .build();
    }

    protected createInclusionEdge(edge: InclusionEdge): GEdge {
        return this.createBaseEdgeBuilder(edge, 'edge:inclusion', 'inclusion-edge')
            .add(this.createLabel(`${edge.id}_label`, 'Inclusion', 'label:static', 'inclusion-label'))
            .build();
    }

    protected createDisjointnessEdge(edge: DisjointnessEdge): GEdge {
        return this.createBaseEdgeBuilder(edge, 'edge:disjointness', 'disjointness-edge').build();
    }

    protected createOverlappingEdge(edge: OverlappingEdge): GEdge {
        return this.createBaseEdgeBuilder(edge, 'edge:overlap', 'overlapping-edge').build();
    }

    // Logic

    private computeCardinality(allEdges: WeightedEdge[], relationId: string): string {
        const allConnectedEdges = allEdges.filter(e => e.targetId === relationId);
        const edgesWithoutCardinality = allConnectedEdges.every(e => e.description.includes('New Weighted Edge'));
        const manyEdgesCount = allConnectedEdges.filter(e => e.description.includes('..N')).length;

        if (edgesWithoutCardinality || allConnectedEdges.length < 2) return '-';

        let cardinalityText = '';
        if (allConnectedEdges.length === 2) {
            switch (manyEdgesCount) {
                case 2: cardinalityText = 'N:M'; break;
                case 1: cardinalityText = '1:N'; break;
                default: cardinalityText = '1:1'; break;
            }
        } else if (allConnectedEdges.length === 3) {
            switch (manyEdgesCount) {
                case 3: cardinalityText = 'N:M:P'; break;
                case 2: cardinalityText = '1:N:M'; break;
                case 1: cardinalityText = '1:1:N'; break;
                default: cardinalityText = '1:1:1'; break;
            }
        }
        return cardinalityText;
    }

    private updatePortPositions(edges: GEdge[], nodes: GNode[]): void {
        const ENTITY_WIDTH = 100;
        const ENTITY_HEIGHT = 40;
        const RELATION_SIZE = 60;
        const nodeMap = new Map<string, GNode>(nodes.map(n => [n.id, n]));
        const t = 0.3;

        edges.forEach(edge => {
            if (edge.type === 'edge:weighted') {
                const source = nodeMap.get(edge.sourceId);
                const target = nodeMap.get(edge.targetId);
                const port = edge.children?.find(c => c.type === 'port:constraint') as GPort;

                if (source?.position && target?.position && port) {
                    const sCenter = {
                        x: source.position.x + (source.size?.width ?? ENTITY_WIDTH) / 2,
                        y: source.position.y + (source.size?.height ?? ENTITY_HEIGHT) / 2
                    };
                    const tCenter = {
                        x: target.position.x + (target.size?.width ?? RELATION_SIZE) / 2,
                        y: target.position.y + (target.size?.height ?? RELATION_SIZE) / 2
                    };
                    port.position = {
                        x: (1 - t) * sCenter.x + t * tCenter.x,
                        y: (1 - t) * sCenter.y + t * tCenter.y
                    };
                }
            }
        });
    }

}
