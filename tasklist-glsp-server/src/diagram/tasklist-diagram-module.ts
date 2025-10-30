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
    ActionHandlerConstructor,
    BindingTarget,
    ComputedBoundsActionHandler,
    DiagramConfiguration,
    DiagramModule,
    GModelFactory,
    GModelIndex,
    InstanceMultiBinding,
    LabelEditValidator,
    ModelState,
    OperationHandlerConstructor,
    SourceModelStorage
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { CreateAttributeHandler } from '../handler/create-attribute-node-handler';
import { CreateDerivedAttributeHandler } from '../handler/create-derived-attribute-node-handler';
import { CreateExistenceDependentRelationHandler } from '../handler/create-existence-dependent-relation-node-handler';
import { CreateIdentifyingDependentRelationHandler } from '../handler/create-identifying-dependent-relation-node-handler';
import { CreateKeyAttributeHandler } from '../handler/create-key-attribute-node-handler';
import { CreateMultiValuedAttributeHandler } from '../handler/create-multi-valued-attribute-node-handler';
import { CreateOptionalAttributeEdgeHandler } from '../handler/create-optional-attribute-edge-handler';
import { CreatePartialExclusiveSpecializationNodeHandler } from '../handler/create-partial-exclusive-specialization-node-handler';
import { CreatePartialOverlappedSpecializationNodeHandler } from '../handler/create-partial-overlapped-specialization-node-handler';
import { CreateRelationHandler } from '../handler/create-relation-node-handler';
import { CreateTaskHandler } from '../handler/create-task-node-handler';
import { CreateTotalExclusiveSpecializationNodeHandler } from '../handler/create-total-exclusive-specialization-node-handler';
import { CreateTotalOverlappedSpecializationNodeHandler } from '../handler/create-total-overlapped-specialization-node-handler';
import { CreateTransitionHandler } from '../handler/create-transition-handler';
import { CreateWeakEntityHandler } from '../handler/create-weak-entity-node-handler';
import { CreateWeightedEdgeHandler } from '../handler/create-weighted-edge-handler';
import { DeleteElementHandler } from '../handler/delete-element-handler';
import { TaskListModelValidator } from '../handler/diagram-validator';
import { TaskListApplyLabelEditHandler } from '../handler/tasklist-apply-label-edit-handler';
import { TaskListChangeBoundsHandler } from '../handler/tasklist-change-bounds-handler';
import { TaskListLabelEditValidator } from '../handler/tasklist-label-edit-validator';
import { TaskListGModelFactory } from '../model/tasklist-gmodel-factory';
import { TaskListModelIndex } from '../model/tasklist-model-index';
import { TaskListModelState } from '../model/tasklist-model-state';
import { TaskListStorage } from '../model/tasklist-storage';
import { TaskListDiagramConfiguration } from './tasklist-diagram-configuration';

@injectable()
export class TaskListDiagramModule extends DiagramModule {
    readonly diagramType = 'tasklist-diagram';

    protected bindDiagramConfiguration(): BindingTarget<DiagramConfiguration> {
        return TaskListDiagramConfiguration;
    }

    protected bindSourceModelStorage(): BindingTarget<SourceModelStorage> {
        return TaskListStorage;
    }

    protected bindModelState(): BindingTarget<ModelState> {
        return { service: TaskListModelState };
    }

    protected bindGModelFactory(): BindingTarget<GModelFactory> {
        return TaskListGModelFactory;
    }

    protected override configureActionHandlers(binding: InstanceMultiBinding<ActionHandlerConstructor>): void {
        super.configureActionHandlers(binding);
        binding.add(ComputedBoundsActionHandler);
    }

    protected override configureOperationHandlers(binding: InstanceMultiBinding<OperationHandlerConstructor>): void {
        super.configureOperationHandlers(binding);
        binding.add(CreateTaskHandler);
        binding.add(CreateWeakEntityHandler);
        binding.add(CreateRelationHandler);
        binding.add(CreateExistenceDependentRelationHandler);
        binding.add(CreateIdentifyingDependentRelationHandler);
        binding.add(CreatePartialExclusiveSpecializationNodeHandler);
        binding.add(CreateTotalExclusiveSpecializationNodeHandler);
        binding.add(CreatePartialOverlappedSpecializationNodeHandler);
        binding.add(CreateTotalOverlappedSpecializationNodeHandler);
        binding.add(CreateAttributeHandler);
        binding.add(CreateMultiValuedAttributeHandler);
        binding.add(CreateDerivedAttributeHandler);
        binding.add(CreateKeyAttributeHandler);
        binding.add(CreateTransitionHandler);
        binding.add(CreateWeightedEdgeHandler);
        binding.add(CreateOptionalAttributeEdgeHandler);
        binding.add(TaskListChangeBoundsHandler);
        binding.add(TaskListApplyLabelEditHandler);
        binding.add(DeleteElementHandler);
    }

    protected override bindModelValidator(): BindingTarget<TaskListModelValidator> | undefined {
        return TaskListModelValidator;
    }

    protected override bindGModelIndex(): BindingTarget<GModelIndex> {
        this.context.bind(TaskListModelIndex).toSelf().inSingletonScope();
        return { service: TaskListModelIndex };
    }

    protected override bindLabelEditValidator(): BindingTarget<LabelEditValidator> | undefined {
        return TaskListLabelEditValidator;
    }
}
