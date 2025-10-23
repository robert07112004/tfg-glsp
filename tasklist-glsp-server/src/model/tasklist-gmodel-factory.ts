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
import { Attribute, DerivedAttribute, KeyAttribute, MultiValuedAttribute, Relation, Task, Transition, WeightedEdge } from './tasklist-model';
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
            ...taskList.relations.map(relation => this.createRelationNode(relation)),
            ...taskList.attributes.map(attribute => this.createAttributeNode(attribute)),
            ...taskList.multiValuedAttributes.map(multiValuedAttribute => this.createMultiValuedAttributeNode(multiValuedAttribute)),
            ...taskList.derivedAttributes.map(derivedAttribute => this.createDerivedAttributeNode(derivedAttribute)),
            ...taskList.keyAttributes.map(keyAttribute => this.createKeyAttributeNode(keyAttribute))
        ];
        
        const childEdges = [
            ...taskList.transitions.map(transition => this.createTransitionEdge(transition)),
            ...taskList.weightedEdges.map(weightedEdge => this.createWeightedEdge(weightedEdge))
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

    protected createRelationNode(relation: Relation): GNode {
        const builder = GNode.builder()
            .id(relation.id)
            .type(DefaultTypes.NODE_DIAMOND)
            .addCssClass('relation-node')
            .add(GLabel.builder().text(relation.name).id(`${relation.id}_label`).build())
            .layout('hbox')
            .addLayoutOption('hAlign', 'center')
            .addLayoutOption('vAlign', 'center')
            .position(relation.position);
        
        if (relation.size) {
            builder.addLayoutOptions({ prefWidth: relation.size.width, prefHeight: relation.size.height });
        }

        return builder.build();
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
            .addCssClass('weighted-edge')
            .sourceId(weightedEdge.sourceId)
            .targetId(weightedEdge.targetId)
            .add(
                GLabel.builder()
                    .id(`${weightedEdge.id}_label`)
                    .type('label:weighted')
                    .text(weightedEdge.description ?? '')
                    .build()
            )
            .build();
    }

}
