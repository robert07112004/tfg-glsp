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
import {
    Command,
    DeleteElementOperation,
    GEdge,
    GNode,
    JsonOperationHandler,
    MaybePromise,
    remove,
    toTypeGuard
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { Attribute, DerivedAttribute, ExistenceDependentRelation, IdentifyingDependentRelation, KeyAttribute, MultiValuedAttribute, OptionalAttributeEdge, PartialExclusiveSpecialization, Relation, Task, TotalExclusiveSpecialization, Transition, WeakEntity, WeightedEdge } from '../model/tasklist-model';
import { TaskListModelState } from '../model/tasklist-model-state';

@injectable()
export class DeleteElementHandler extends JsonOperationHandler {
    readonly operationType = DeleteElementOperation.KIND;

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: DeleteElementOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            operation.elementIds.forEach(elementId => this.delete(elementId));
        });
    }

    protected delete(elementId: string): void {
        const index = this.modelState.index;
        const gModelElement = this.getGModelElementToDelete(elementId);
        const gModelElementId = gModelElement?.id ?? elementId;
        const gEdgeIds = this.getIncomingAndOutgoingEdgeIds(gModelElement);

        [...gEdgeIds, gModelElementId]
            .map(id => index.findTaskOrTransition(id))
            .forEach(modelElement => this.deleteModelElement(modelElement));
    }

    private getGModelElementToDelete(elementId: string): GNode | GEdge | undefined {
        const index = this.modelState.index;
        const element = index.get(elementId);
        if (element instanceof GNode || element instanceof GEdge) {
            return element;
        }
        return index.findParentElement(elementId, toTypeGuard(GNode)) ?? index.findParentElement(elementId, toTypeGuard(GEdge));
    }

    protected getIncomingAndOutgoingEdgeIds(node: GNode | GEdge | undefined): string[] {
        return this.getIncomingAndOutgoingEdges(node).map(edge => edge.id);
    }

    protected getIncomingAndOutgoingEdges(node: GNode | GEdge | undefined): GEdge[] {
        if (node instanceof GNode) {
            return [...this.modelState.index.getIncomingEdges(node), ...this.modelState.index.getOutgoingEdges(node)];
        }
        return [];
    }

    private deleteModelElement(modelElement: Task | WeakEntity | Relation | ExistenceDependentRelation | 
                                             IdentifyingDependentRelation | PartialExclusiveSpecialization | 
                                             TotalExclusiveSpecialization | Attribute | 
                                             MultiValuedAttribute | DerivedAttribute | 
                                             KeyAttribute | Transition | WeightedEdge | 
                                             OptionalAttributeEdge | undefined): void {
        if (Task.is(modelElement)) {
            remove(this.modelState.sourceModel.tasks, modelElement);
        } else if (WeakEntity.is(modelElement)) {
            remove(this.modelState.sourceModel.weakEntities, modelElement);
        } else if (Relation.is(modelElement)) {
            remove(this.modelState.sourceModel.relations, modelElement);
        } else if (ExistenceDependentRelation.is(modelElement)) {
            remove(this.modelState.sourceModel.existenceDependentRelations, modelElement);
        } else if (IdentifyingDependentRelation.is(modelElement)) {
            remove(this.modelState.sourceModel.identifyingDependentRelations, modelElement);
        } else if (PartialExclusiveSpecialization.is(modelElement)) {
            remove(this.modelState.sourceModel.partialExclusiveSpecializations, modelElement);
        } else if (TotalExclusiveSpecialization.is(modelElement)) {
            remove(this.modelState.sourceModel.totalExclusiveSpecializations, modelElement);
        } else if (Attribute.is(modelElement)) {
            remove(this.modelState.sourceModel.attributes, modelElement);
        } else if (MultiValuedAttribute.is(modelElement)) {
            remove(this.modelState.sourceModel.multiValuedAttributes, modelElement);
        } else if (DerivedAttribute.is(modelElement)) {
            remove(this.modelState.sourceModel.derivedAttributes, modelElement);
        } else if (KeyAttribute.is(modelElement)) {
            remove(this.modelState.sourceModel.keyAttributes, modelElement);
        } else if (Transition.is(modelElement)) {
            remove(this.modelState.sourceModel.transitions, modelElement);
        } else if (WeightedEdge.is(modelElement)) {
            remove(this.modelState.sourceModel.weightedEdges, modelElement);
        } else if (OptionalAttributeEdge.is(modelElement)) {
            remove(this.modelState.sourceModel.optionalAttributeEdges, modelElement)
        }
    }
}
