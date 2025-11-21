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
import { DefaultTypes, GEdge, GGraph, GLabel, GModelFactory, GNode } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { AlternativeKeyAttribute, Attribute, DerivedAttribute, ExistenceDependentRelation, IdentifyingDependentRelation, KeyAttribute, MultiValuedAttribute, OptionalAttributeEdge, PartialExclusiveSpecialization, PartialOverlappedSpecialization, Relation, Task, TotalExclusiveSpecialization, TotalOverlappedSpecialization, Transition, WeakEntity, WeightedEdge } from './tasklist-model';
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
            ...taskList.optionalAttributeEdges.map(optionalAttributeEdge => this.createOptionalAttributeEdge(optionalAttributeEdge))
        ]

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
            .position(relation.position);
        
        if (relation.size) {
            builder.addLayoutOptions({ prefWidth: relation.size.width, prefHeight: relation.size.height });
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
        }

        return builder.build();
    }

    protected createPartialExclusiveSpecializationNode(partialExclusiveSpecialization: PartialExclusiveSpecialization): GNode {
        const builder = GNode.builder()
            .id(partialExclusiveSpecialization.id)
            .type('node:partialExclusiveSpecialization')
            .addCssClass('partial-exclusive-specialization-node')
            .add(GLabel.builder()
                .text(partialExclusiveSpecialization.name)
                .id(`${partialExclusiveSpecialization.id}_label`)
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
                .text(totalExclusiveSpecialization.name)
                .id(`${totalExclusiveSpecialization.id}_label`)
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
                .text(partialOverlappedSpecialization.name)
                .id(`${partialOverlappedSpecialization.id}_label`)
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
                .text(totalOverlappedSpecialization.name)
                .id(`${totalOverlappedSpecialization.id}_label`)
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
            .build();
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
    
}
