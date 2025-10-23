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
import { ApplyLabelEditOperation } from '@eclipse-glsp/protocol';
import { Command, GEdge, GLSPServerError, GNode, JsonOperationHandler, MaybePromise, toTypeGuard } from '@eclipse-glsp/server/node';
import { inject, injectable } from 'inversify';
import { TaskListModelState } from '../model/tasklist-model-state';

@injectable()
export class TaskListApplyLabelEditHandler extends JsonOperationHandler {
    readonly operationType = ApplyLabelEditOperation.KIND;

    @inject(TaskListModelState)
    protected override readonly modelState: TaskListModelState;

    override createCommand(operation: ApplyLabelEditOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const index = this.modelState.index;
            const parentNode = index.findParentElement(operation.labelId, toTypeGuard(GNode));
            if (parentNode) {
                const task = index.findTask(parentNode.id);
                const relation = index.findRelation(parentNode.id);
                const attribute = index.findAttribute(parentNode.id);
                const multiValuedAttribute = index.findMultiValuedAttribute(parentNode.id);
                const derivedAttribute = index.findDerivedAttribute(parentNode.id);
                const keyAttribute = index.findKeyAttribute(parentNode.id);
                if (task) {
                    task.name = operation.text;
                } else if (relation) {
                    relation.name = operation.text;
                } else if (attribute) {
                    attribute.name = operation.text;
                } else if (multiValuedAttribute) {
                    multiValuedAttribute.name = operation.text;
                } else if (derivedAttribute) {
                    derivedAttribute.name = operation.text;
                } else if (keyAttribute) {
                    keyAttribute.name = operation.text;
                } else {
                    throw new GLSPServerError(`Could not find model element for node with id ${parentNode.id}`);
                }
            } else {
                const parentEdge = index.findParentElement(operation.labelId, toTypeGuard(GEdge));
                if (parentEdge) {
                    const weightedEdge = index.findWeightedEdge(parentEdge.id);
                    if (weightedEdge) {
                        weightedEdge.description = operation.text;
                    } else {
                        throw new GLSPServerError(`Could not find model element for edge with id ${parentEdge.id}`);
                    }
                }    
            }
        });
    }
}
