/********************************************************************************
 * Copyright (c) 2022 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied:
 * -- GNU General Public License, version 2 with the GNU Classpath Exception
 * which is available at https://www.gnu.org/software/classpath/license.html
 * -- MIT License which is available at https://opensource.org/license/mit.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0 OR MIT
 ********************************************************************************/
import { DefaultTypes, GEdge, GGraph, GLabel, GModelFactory, GNode, GPort } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { AlternativeKeyAttribute, Attribute, DerivedAttribute, DisjointnessEdge, ExclusionEdge, ExistenceDependentRelation, IdentifyingDependentRelation, InclusionEdge, KeyAttribute, MultiValuedAttribute, OptionalAttributeEdge, OverlappingEdge, PartialExclusiveSpecialization, PartialOverlappedSpecialization, Relation, Task, TotalExclusiveSpecialization, TotalOverlappedSpecialization, Transition, WeakEntity, WeightedEdge } from './tasklist-model';
import { TaskListModelState } from './tasklist-model-state';

@injectable()
export class TaskListGModelFactory implements GModelFactory {
    @inject(TaskListModelState)
    protected modelState: TaskListModelState;

    createModel(): void {
        const taskList = this.modelState.sourceModel;
        this.modelState.index.indexTaskList(taskList);
        
        const childNodes = [
            ...taskList.tasks.map(task => this.createTaskNode(task)),
            ...taskList.weakEntities.map(weakEntity => this.createWeakEntityNode(weakEntity)),
            ...taskList.relations.map(relation => this.createRelationNode(relation, taskList.weightedEdges)),
            ...taskList.existenceDependentRelations.map(existenceDependentRelation => this.createExistenceDependentRelationNode(existenceDependentRelation, taskList.weightedEdges)),
            ...taskList.identifyingDependentRelations.map(identifyingDependentRelation => this.createIdentifyingDependentRelationNode(identifyingDependentRelation, taskList.weightedEdges)),
            ...taskList.partialExclusiveSpecializations.map(partialExclusiveSpecialization => this.createPartialExclusiveSpecializationNode(partialExclusiveSpecialization)),
            ...taskList.totalExclusiveSpecializations.map(totalExclusiveSpecialization => this.createTotalExclusiveSpecializationNode(totalExclusiveSpecialization)),
            ...taskList.partialOverlappedSpecializations.map(partialOverlappedSpecialization => this.createPartialOverlappedSpecializationNode(partialOverlappedSpecialization)),
            ...taskList.totalOverlappedSpecializations.map(totalOverlappedSpecialization => this.createTotalOverlappedSpecializationNode(totalOverlappedSpecialization)),
            ...taskList.attributes.map(attribute => this.createAttributeNode(attribute)),
            ...taskList.multiValuedAttributes.map(multiValuedAttribute => this.createMultiValuedAttributeNode(multiValuedAttribute)),
            ...taskList.derivedAttributes.map(derivedAttribute => this.createDerivedAttributeNode(derivedAttribute)),
            ...taskList.keyAttributes.map(keyAttribute => this.createKeyAttributeNode(keyAttribute)),
            ...taskList.alternativeKeyAttributes.map(alternativeKeyAttribute => this.createAlternativeKeyAttributeNode(alternativeKeyAttribute))
        ];
        
        const childEdges = [
            ...taskList.transitions.map(transition => this.createTransitionEdge(transition)),
            ...taskList.weightedEdges.map(weightedEdge => this.createWeightedEdge(weightedEdge)),
            ...taskList.optionalAttributeEdges.map(optionalAttributeEdge => this.createOptionalAttributeEdge(optionalAttributeEdge)),
            ...(taskList.exclusionEdges || []).map(edge => this.createExclusionEdge(edge)),
            ...(taskList.inclusionEdges || []).map(inclusionEdge => this.createInclusionEdge(inclusionEdge)),
            ...(taskList.disjointnessEdges || []).map(disjointnessEdge => this.createDisjointnessEdge(disjointnessEdge)),
            ...(taskList.overlappingEdges || []).map(overlappingEdge => this.createOverlappingEdge(overlappingEdge))
        ]

        this.preprocessParallelEdges(childEdges, childNodes);
        this.updatePortPositions(childEdges, childNodes);

        const newRoot = GGraph.builder()
            .id(taskList.id)
            .addChildren(childNodes)
            .addChildren(childEdges)
            .build();
        this.modelState.updateRoot(newRoot);
    }

    protected createTaskNode(task: Task): GNode {
        const builder = GNode.builder()
            .id(task.id)
            .type(DefaultTypes.NODE_RECTANGLE)
            .addCssClass('entity-node')
            .add(GLabel.builder().text(task.name).id(`${task.id}_label`).build())
            .layout('vbox')
            .addLayoutOption('hAlign', 'center')
            .addLayoutOption('vAlign', 'middle')
            .position(task.position);

        if (task.size) {
            builder.addLayoutOptions({ prefWidth: task.size.width, prefHeight: task.size.height });
        } else {
            builder.addLayoutOptions({ prefWidth: 100, prefHeight: 40 });
        }

        return builder.build();
    }

    protected createWeakEntityNode(weakEntity: WeakEntity): GNode {
        const builder = GNode.builder()
            .id(weakEntity.id)
            .type('node:weakEntity')
            .addCssClass('weak-entity-node')
            .add(GLabel.builder().text(weakEntity.name).id(`${weakEntity.id}_label`).build())
            .layout('vbox')
            .addLayoutOption('hAlign', 'center')
            .addLayoutOption('vAlign', 'middle')
            .position(weakEntity.position);

        if (weakEntity.size) {
            builder.addLayoutOptions({ prefWidth: weakEntity.size.width, prefHeight: weakEntity.size.height });
        } else {
            builder.addLayoutOptions({ prefWidth: 100, prefHeight: 40 });
        }

        return builder.build();
    }

    protected createRelationNode(relation: Relation, weightedEdges: WeightedEdge[]): GNode {
        const builder = GNode.builder()
            .id(relation.id)
            .type(DefaultTypes.NODE_DIAMOND)
            .addCssClass('relation-node')
            .add(GLabel.builder()
                .text(relation.name)
                .id(`${relation.id}_label`)
                .build())
            .add(GLabel.builder()
                .text(this.computeCardinality(weightedEdges, relation.id))
                .id(`${relation.id}_cardinality_label`)
                .type('label:cardinality')
                .addCssClass('cardinality-label')
                .build())
            .layout('vbox')
            .addLayoutOption('hAlign', 'center')
            .addLayoutOption('vAlign', 'center')
            .addLayoutOption('paddingTop', 15)      
            .addLayoutOption('paddingBottom', 15)   
            .addLayoutOption('paddingLeft', 20)  
            .addLayoutOption('paddingRight', 20)
            .position(relation.position);
        
        if (relation.size) {
            builder.addLayoutOptions({ prefWidth: relation.size.width, prefHeight: relation.size.height });
        } else {
            builder.addLayoutOptions({ prefWidth: 60, prefHeight: 60 });
        }

        return builder.build();
    }

    protected createExistenceDependentRelationNode(existenceDependentRelation: ExistenceDependentRelation, weightedEdges: WeightedEdge[]): GNode {
        const builder = GNode.builder()
            .id(existenceDependentRelation.id)
            .type('node:existenceDependentRelation')
            .addCssClass('existence-dependent-relation-node')

            .add(GLabel.builder()
                .text('E')
                .id(`${existenceDependentRelation.id}_existence_label`)
                .type('label:static')
                .addCssClass('existence-label')
                .build())
            .add(GLabel.builder()
                .text(existenceDependentRelation.name)
                .id(`${existenceDependentRelation.id}_label`)
                .build())
            .add(GLabel.builder()
                .text(this.computeCardinality(weightedEdges, existenceDependentRelation.id))
                .id(`${existenceDependentRelation.id}_cardinality_label`)
                .type('label:cardinality')
                .addCssClass('cardinality-label')
                .build())
            
            .layout('vbox')
            .addLayoutOption('hAlign', 'center')
            .addLayoutOption('vAlign', 'center')
            .position(existenceDependentRelation.position);
        
        if (existenceDependentRelation.size) {
            builder.addLayoutOptions({ prefWidth: existenceDependentRelation.size.width, prefHeight: existenceDependentRelation.size.height });
        } else {
            builder.addLayoutOptions({ prefWidth: 60, prefHeight: 60 });
        }

        return builder.build();
    }

    protected createIdentifyingDependentRelationNode(identifyingDependentRelation: IdentifyingDependentRelation, weightedEdges: WeightedEdge[]): GNode {
        const builder = GNode.builder()
            .id(identifyingDependentRelation.id)
            .type('node:identifyingDependentRelation')
            .addCssClass('existence-dependent-relation-node')
            .add(GLabel.builder()
                .text('Id')
                .id(`${identifyingDependentRelation.id}_identifying_label`)
                .type('label:static')
                .addCssClass('existence-label')
                .build())
            .add(GLabel.builder()
                .text(identifyingDependentRelation.name)
                .id(`${identifyingDependentRelation.id}_label`)
                .build())
            .add(GLabel.builder()
                .text(this.computeCardinality(weightedEdges, identifyingDependentRelation.id))
                .id(`${identifyingDependentRelation.id}_cardinality_label`)
                .type('label:cardinality')
                .addCssClass('cardinality-label')
                .build())
            
            .layout('vbox')
            .addLayoutOption('hAlign', 'center')
            .addLayoutOption('vAlign', 'center')
            .position(identifyingDependentRelation.position);
        
        if (identifyingDependentRelation.size) {
            builder.addLayoutOptions({ prefWidth: identifyingDependentRelation.size.width, prefHeight: identifyingDependentRelation.size.height });
        } else {
            builder.addLayoutOptions({ prefWidth: 60, prefHeight: 60 });
        }

        return builder.build();
    }

    protected createPartialExclusiveSpecializationNode(partialExclusiveSpecialization: PartialExclusiveSpecialization): GNode {
        const builder = GNode.builder()
            .id(partialExclusiveSpecialization.id)
            .type('node:partialExclusiveSpecialization')
            .addCssClass('partial-exclusive-specialization-node')
            .add(GLabel.builder()
                .text('Partial Exclusive')
                .id(`${partialExclusiveSpecialization.id}_label`)
                .type('label:static')
                .addCssClass('existence-label')
                .build()
            )
            .layout('vbox')
            .addLayoutOption('hAlign', 'center')
            .addLayoutOption('vAlign', 'middle')
            .position(partialExclusiveSpecialization.position);

        if (partialExclusiveSpecialization.size) {
            builder.addLayoutOptions({ prefWidth: partialExclusiveSpecialization.size.width, prefHeight: partialExclusiveSpecialization.size.height });
        }

        return builder.build();   
    }

    protected createTotalExclusiveSpecializationNode(totalExclusiveSpecialization: TotalExclusiveSpecialization): GNode {
        const builder = GNode.builder()
            .id(totalExclusiveSpecialization.id)
            .type('node:totalExclusiveSpecialization')
            .addCssClass('total-exclusive-specialization-node')
            .add(GLabel.builder()
                .text('Total Exclusive')
                .id(`${totalExclusiveSpecialization.id}_label`)
                .type('label:static')
                .addCssClass('existence-label')
                .build()
            )
            .layout('vbox')
            .addLayoutOption('hAlign', 'center')
            .addLayoutOption('vAlign', 'middle')
            .position(totalExclusiveSpecialization.position);

        if (totalExclusiveSpecialization.size) {
            builder.addLayoutOptions({ prefWidth: totalExclusiveSpecialization.size.width, prefHeight: totalExclusiveSpecialization.size.height });
        }

        return builder.build();

    }

    protected createPartialOverlappedSpecializationNode(partialOverlappedSpecialization: PartialOverlappedSpecialization): GNode {
        const builder = GNode.builder()
            .id(partialOverlappedSpecialization.id)
            .type('node:partialOverlappedSpecialization')
            .addCssClass('partial-overlapped-specialization-node')
            .add(GLabel.builder()
                .text('PartialOverlapped')
                .id(`${partialOverlappedSpecialization.id}_label`)
                .type('label:static')
                .addCssClass('existence-label')
                .build()
            )
            .layout('vbox')
            .addLayoutOption('hAlign', 'center')
            .addLayoutOption('vAlign', 'middle')
            .position(partialOverlappedSpecialization.position);

        if (partialOverlappedSpecialization.size) {
            builder.addLayoutOptions({ prefWidth: partialOverlappedSpecialization.size.width, prefHeight: partialOverlappedSpecialization.size.height });
        }

        return builder.build();
    }

    protected createTotalOverlappedSpecializationNode(totalOverlappedSpecialization: TotalOverlappedSpecialization): GNode {
        const builder = GNode.builder()
            .id(totalOverlappedSpecialization.id)
            .type('node:totalOverlappedSpecialization')
            .addCssClass('total-overlapped-specialization-node')
            .add(GLabel.builder()
                .text('Total Overlapped')
                .id(`${totalOverlappedSpecialization.id}_label`)
                .type('label:static')
                .addCssClass('existence-label')
                .build()
            )
            .layout('vbox')
            .addLayoutOption('hAlign', 'center')
            .addLayoutOption('vAlign', 'middle')
            .position(totalOverlappedSpecialization.position);

        if (totalOverlappedSpecialization.size) {
            builder.addLayoutOptions({ prefWidth: totalOverlappedSpecialization.size.width, prefHeight: totalOverlappedSpecialization.size.height });
        }

        return builder.build();
    }

    protected computeCardinality(allEdges: WeightedEdge[], relationId: string): string {
        const allConnectedEdges = allEdges.filter(
            e => e.targetId === relationId || e.sourceId === relationId
        );

        const manyEdgesCount = allConnectedEdges.filter(
            e => e.description.includes('..N')
        ).length;
        
        if (manyEdgesCount >= 2) {
            return 'N:M';
        } else if (manyEdgesCount === 1) {
            return '1:N';
        } else if (allConnectedEdges.length > 0) {
            return '1:1';
        } else {
            return '-';
        }
    }

    protected createAttributeNode(attribute: Attribute): GNode {
        const builder = GNode.builder()
            .id(attribute.id)
            .type('node:attribute') 
            .addCssClass('attribute-node')
            .add(GLabel.builder().text(attribute.name).id(`${attribute.id}_label`).build())
            .layout('vbox')
            .addLayoutOption('hAlign', 'center')
            .addLayoutOption('vAlign', 'middle')
            .position(attribute.position);

        if (attribute.size) {
            builder.addLayoutOptions({ prefWidth: attribute.size.width, prefHeight: attribute.size.height });
        }

        return builder.build();
    }

    protected createMultiValuedAttributeNode(multiValuedAttribute: MultiValuedAttribute): GNode {
        const builder = GNode.builder()
            .id(multiValuedAttribute.id)
            .type('node:multiValuedAttribute') 
            .addCssClass('multi-valued-attribute-node')
            .add(GLabel.builder().text(multiValuedAttribute.name).id(`${multiValuedAttribute.id}_label`).build())
            .layout('vbox')
            .addLayoutOption('hAlign', 'center')
            .addLayoutOption('vAlign', 'middle')
            .position(multiValuedAttribute.position);

        if (multiValuedAttribute.size) {
            builder.addLayoutOptions({ prefWidth: multiValuedAttribute.size.width, prefHeight: multiValuedAttribute.size.height });
        }

        return builder.build();
    }

    protected createDerivedAttributeNode(derivedAttribute: DerivedAttribute): GNode {
        const builder = GNode.builder()
            .id(derivedAttribute.id)
            .type('node:derivedAttribute') 
            .addCssClass('derived-attribute-node')
            .add(GLabel.builder().text(derivedAttribute.name).id(`${derivedAttribute.id}_label`).build())
            .add(GLabel.builder().text(derivedAttribute.equation).id(`${derivedAttribute.id}_equation_label`).build())
            .layout('vbox')
            .addLayoutOption('hAlign', 'center')
            .addLayoutOption('vAlign', 'middle')
            .position(derivedAttribute.position);

        if (derivedAttribute.size) {
            builder.addLayoutOptions({ prefWidth: derivedAttribute.size.width, prefHeight: derivedAttribute.size.height });
        }

        return builder.build();
    }
    
    protected createKeyAttributeNode(keyAttribute: KeyAttribute): GNode {
        const builder = GNode.builder()
            .id(keyAttribute.id)
            .type('node:keyAttribute') 
            .addCssClass('key-attribute-node')
            .add(GLabel.builder()
                    .text(keyAttribute.name)
                    .id(`${keyAttribute.id}_label`)
                    .addCssClass('key-attribute-label')
                    .build())
            .layout('vbox')
            .addLayoutOption('hAlign', 'center')
            .addLayoutOption('vAlign', 'middle')
            .position(keyAttribute.position);

        if (keyAttribute.size) {
            builder.addLayoutOptions({ prefWidth: keyAttribute.size.width, prefHeight: keyAttribute.size.height });
        }

        return builder.build();
    }

    protected createAlternativeKeyAttributeNode(alternativeKeyAttribute: AlternativeKeyAttribute): GNode {
        const builder = GNode.builder()
            .id(alternativeKeyAttribute.id)
            .type('node:alternativeKeyAttribute') 
            .addCssClass('alternative-key-attribute-node')
            .add(GLabel.builder()
                    .text(alternativeKeyAttribute.name)
                    .id(`${alternativeKeyAttribute.id}_label`)
                    .addCssClass('alternative-key-attribute-label')
                    .build())
            .layout('vbox')
            .addLayoutOption('hAlign', 'center')
            .addLayoutOption('vAlign', 'middle')
            .position(alternativeKeyAttribute.position);

        if (alternativeKeyAttribute.size) {
            builder.addLayoutOptions({ prefWidth: alternativeKeyAttribute.size.width, prefHeight: alternativeKeyAttribute.size.height });
        }

        return builder.build();
    }

    protected createTransitionEdge(transition: Transition): GEdge {
        return GEdge.builder()
            .id(transition.id)
            .addCssClass('tasklist-transition')
            .sourceId(transition.sourceTaskId)
            .targetId(transition.targetTaskId)
            .build();
    }

    protected createWeightedEdge(weightedEdge: WeightedEdge): GEdge {
        return GEdge.builder()
            .id(weightedEdge.id)
            .type('edge:weighted')
            .addCssClass('weighted-edge')
            .sourceId(weightedEdge.sourceId)
            .targetId(weightedEdge.targetId)
            .add(
                GLabel.builder()
                    .id(`${weightedEdge.id}_label`)
                    .type('label:weighted')
                    .addCssClass('weighted-edge-label')
                    .text(weightedEdge.description ?? '')
                    .build()
            )
            .add(
                GPort.builder()
                    .id(`${weightedEdge.id}_port`)
                    .type('port:constraint')
                    .build()
            )
            .build();
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

    protected createOptionalAttributeEdge(optionalAttributeEdge: OptionalAttributeEdge): GEdge {
        return GEdge.builder()
            .id(optionalAttributeEdge.id)
            .type('edge:optional') 
            .addCssClass('optional-attribute-edge') 
            .sourceId(optionalAttributeEdge.sourceId)
            .targetId(optionalAttributeEdge.targetId)
            .build();
    }
 
    protected createExclusionEdge(exclusionEdge: ExclusionEdge): GEdge {
        return GEdge.builder()
            .id(exclusionEdge.id)
            .type('edge:exclusion')
            .addCssClass('exclusion-edge')
            .sourceId(exclusionEdge.sourceId)
            .targetId(exclusionEdge.targetId)
            .add(GLabel.builder()
                .id(`${exclusionEdge.id}_label`)
                .type('label:static')
                .text('Exclusion')
                .addCssClass('exclusion-label')
                .build())
            .build();
    }

    protected createInclusionEdge(inclusionEdge: InclusionEdge): GEdge {
        return GEdge.builder()
            .id(inclusionEdge.id)
            .type('edge:inclusion')
            .addCssClass('inclusion-edge')
            .sourceId(inclusionEdge.sourceId)
            .targetId(inclusionEdge.targetId)
            .add(GLabel.builder()
                .id(`${inclusionEdge.id}_label`)
                .type('label:static')
                .text('Inclusion')
                .addCssClass('inclusion-label')
                .build())
            .build();
    }

    protected createDisjointnessEdge(disjointnessEdge: DisjointnessEdge): GEdge {
        return GEdge.builder()
            .id(disjointnessEdge.id)
            .type('edge:disjointness')
            .addCssClass('disjointness-edge')
            .sourceId(disjointnessEdge.sourceId)
            .targetId(disjointnessEdge.targetId)
            .build();
    }

    protected createOverlappingEdge(overlappingEdge: OverlappingEdge): GEdge {
        return GEdge.builder()
            .id(overlappingEdge.id)
            .type('edge:overlap')
            .addCssClass('overlapping-edge')
            .sourceId(overlappingEdge.sourceId)
            .targetId(overlappingEdge.targetId)
            .build();
    }

    private preprocessParallelEdges(edges: GEdge[], nodes: GNode[]): void {
        const nodeMap = new Map<string, GNode>();
        nodes.forEach(n => nodeMap.set(n.id, n));
        const groups = new Map<string, GEdge[]>();
        edges.forEach(edge => {
            const key = [edge.sourceId, edge.targetId].sort().join('-');
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(edge);
        });
        groups.forEach((groupEdges, key) => {
            if (groupEdges.length > 1) {
                const firstEdge = groupEdges[0];
                const sourceNode = nodeMap.get(firstEdge.sourceId);
                const targetNode = nodeMap.get(firstEdge.targetId);
                if (sourceNode && targetNode && sourceNode.position && targetNode.position && sourceNode.id !== targetNode.id) {
                    const x1 = sourceNode.position.x;
                    const y1 = sourceNode.position.y;
                    const x2 = targetNode.position.x;
                    const y2 = targetNode.position.y;
                    const mx = (x1 + x2) / 2;
                    const my = (y1 + y2) / 2;
                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    const length = Math.sqrt(dx * dx + dy * dy) || 1;
                    const px = -dy / length;
                    const py = dx / length;
                    const amplitude = 30; 
                    groupEdges.forEach((edge, index) => {
                        const offset = (index - (groupEdges.length - 1) / 2) * amplitude;
                        edge.routingPoints = [{
                            x: mx + px * offset,
                            y: my + py * offset
                        }];
                    });
                }
            }
        });
    }
}
