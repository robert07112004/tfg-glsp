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
import { GModelIndex } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { Attribute, DerivedAttribute, ExistenceDependentRelation, IdentifyingDependentRelation, KeyAttribute, MultiValuedAttribute, OptionalAttributeEdge, Relation, Task, TaskList, Transition, WeakEntity, WeightedEdge } from './tasklist-model';

@injectable()
export class TaskListModelIndex extends GModelIndex {
    protected idToTaskListElements = new Map<string, Task | WeakEntity | Relation | 
                                                     ExistenceDependentRelation | 
                                                     IdentifyingDependentRelation | Attribute | 
                                                     MultiValuedAttribute | DerivedAttribute | 
                                                     KeyAttribute | Transition | WeightedEdge |
                                                     OptionalAttributeEdge>();

    indexTaskList(taskList: TaskList): void {
        this.idToTaskListElements.clear();
        for (const element of [
            ...taskList.tasks, 
            ...taskList.weakEntities,
            ...taskList.relations,
            ...taskList.existenceDependentRelations,
            ...taskList.identifyingDependentRelations,
            ...taskList.attributes,
            ...taskList.multiValuedAttributes,
            ...taskList.derivedAttributes,
            ...taskList.keyAttributes,
            ...taskList.transitions,
            ...taskList.weightedEdges,
            ...taskList.optionalAttributeEdges
        ]) {
            this.idToTaskListElements.set(element.id, element);
        }
    }

    findTask(id: string): Task | undefined {
        const element = this.findTaskOrTransition(id);
        return Task.is(element) ? element : undefined;
    }

    findWeakEntity(id: string): WeakEntity | undefined {
        const element = this.findTaskOrTransition(id);
        return WeakEntity.is(element) ? element : undefined
    }

    findRelation(id: string): Relation | undefined {
        const element = this.findTaskOrTransition(id);
        return Relation.is(element) ? element : undefined;
    }

    findExistenceDependentRelation(id: string): ExistenceDependentRelation | undefined {
        const element = this.findTaskOrTransition(id);
        return ExistenceDependentRelation.is(element) ? element : undefined
    }

    findIdentifyingDependentRelation(id: string): IdentifyingDependentRelation | undefined {
        const element = this.findTaskOrTransition(id);
        return IdentifyingDependentRelation.is(element) ? element : undefined
    }

    findAttribute(id: string): Attribute | undefined {
        const element = this.findTaskOrTransition(id);
        return Attribute.is(element) ? element : undefined;
    }

    findMultiValuedAttribute(id: string): MultiValuedAttribute | undefined {
        const element = this.findTaskOrTransition(id);
        return MultiValuedAttribute.is(element) ? element : undefined;
    }

    findDerivedAttribute(id: string): DerivedAttribute | undefined {
        const element = this.findTaskOrTransition(id);
        return DerivedAttribute.is(element) ? element : undefined;
    }

    findKeyAttribute(id: string): KeyAttribute | undefined {
        const element = this.findTaskOrTransition(id);
        return KeyAttribute.is(element) ? element : undefined;
    }
    
    findTransition(id: string): Transition | undefined {
        const element = this.findTaskOrTransition(id);
        return Transition.is(element) ? element : undefined;
    }

    findWeightedEdge(id: string): WeightedEdge | undefined {
        const element = this.findTaskOrTransition(id);
        return WeightedEdge.is(element) ? element : undefined;
    }

    findOptionalAttributeEdge(id: string): OptionalAttributeEdge | undefined {
        const element = this.findTaskOrTransition(id);
        return OptionalAttributeEdge.is(element) ? element : undefined
    }

    findTaskOrTransition(id: string): Task | WeakEntity | Relation | ExistenceDependentRelation | 
                                      IdentifyingDependentRelation | Attribute | MultiValuedAttribute | 
                                      DerivedAttribute | KeyAttribute | Transition | WeightedEdge | 
                                      OptionalAttributeEdge | undefined {
        return this.idToTaskListElements.get(id);
    }
    
}