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
import { DeleteElementHandler } from '../handler/delete-element-handler';
import { CreateOptionalAttributeEdgeHandler } from '../handler/edge-handlers/create-optional-attribute-edge-handler';
import { CreateTransitionHandler } from '../handler/edge-handlers/create-transition-handler';
import { CreateWeightedEdgeHandler } from '../handler/edge-handlers/create-weighted-edge-handler';
import { SQLGenerator } from '../handler/generator/sql-generator';
import { CreateAlternativeKeyAttributeHandler } from '../handler/node-handlers/attribute-handlers/create-alternative-key-attribute-node-handler';
import { CreateAttributeHandler } from '../handler/node-handlers/attribute-handlers/create-attribute-node-handler';
import { CreateDerivedAttributeHandler } from '../handler/node-handlers/attribute-handlers/create-derived-attribute-node-handler';
import { CreateKeyAttributeHandler } from '../handler/node-handlers/attribute-handlers/create-key-attribute-node-handler';
import { CreateMultiValuedAttributeHandler } from '../handler/node-handlers/attribute-handlers/create-multi-valued-attribute-node-handler';
import { CreateTaskHandler } from '../handler/node-handlers/entity-handlers/create-task-node-handler';
import { CreateWeakEntityHandler } from '../handler/node-handlers/entity-handlers/create-weak-entity-node-handler';
import { CreateExistenceDependentRelationHandler } from '../handler/node-handlers/relation-handlers/create-existence-dependent-relation-node-handler';
import { CreateIdentifyingDependentRelationHandler } from '../handler/node-handlers/relation-handlers/create-identifying-dependent-relation-node-handler';
import { CreateRelationHandler } from '../handler/node-handlers/relation-handlers/create-relation-node-handler';
import { CreatePartialExclusiveSpecializationNodeHandler } from '../handler/node-handlers/specialization-handlers/create-partial-exclusive-specialization-node-handler';
import { CreatePartialOverlappedSpecializationNodeHandler } from '../handler/node-handlers/specialization-handlers/create-partial-overlapped-specialization-node-handler';
import { CreateTotalExclusiveSpecializationNodeHandler } from '../handler/node-handlers/specialization-handlers/create-total-exclusive-specialization-node-handler';
import { CreateTotalOverlappedSpecializationNodeHandler } from '../handler/node-handlers/specialization-handlers/create-total-overlapped-specialization-node-handler';
import { GenerateSqlActionHandler } from '../handler/sql-handler/generate-sql-handler';
import { TaskListApplyLabelEditHandler } from '../handler/tasklist-apply-label-edit-handler';
import { TaskListChangeBoundsHandler } from '../handler/tasklist-change-bounds-handler';
import { TaskListLabelEditValidator } from '../handler/tasklist-label-edit-validator';
import { TaskListModelValidator } from '../handler/validation/diagram-validator';
import { AlternativeKeyAttributeValidator } from '../handler/validation/validators/attribute-validators/alternative-key-attribute-validator';
import { AttributeValidator } from '../handler/validation/validators/attribute-validators/attribute-validator';
import { DerivedAttributeValidator } from '../handler/validation/validators/attribute-validators/derived-attribute-validator';
import { KeyAttributeValidator } from '../handler/validation/validators/attribute-validators/key-attribute-validator';
import { MultiValuedAttributeValidator } from '../handler/validation/validators/attribute-validators/multi-valued-attribute';
import { EntityValidator } from '../handler/validation/validators/entity-validators/entity-validator';
import { WeakEntityValidator } from '../handler/validation/validators/entity-validators/weak-entity-validator';
import { ExistenceDependenceRelationValidator } from '../handler/validation/validators/relation-validators/existence-dependence-relation';
import { IdentifyingDependenceRelationValidator } from '../handler/validation/validators/relation-validators/identifying-dependence-relation';
import { RelationValidator } from '../handler/validation/validators/relation-validators/relation-validator';
import { AllSpecializationsValidator } from '../handler/validation/validators/specialization-validators/all-specializations-validator';
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
        binding.add(GenerateSqlActionHandler);
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
        binding.add(CreateAlternativeKeyAttributeHandler);
        binding.add(CreateTransitionHandler);
        binding.add(CreateWeightedEdgeHandler);
        binding.add(CreateOptionalAttributeEdgeHandler);
        binding.add(TaskListChangeBoundsHandler);
        binding.add(TaskListApplyLabelEditHandler);
        binding.add(DeleteElementHandler);
    }

    protected override bindModelValidator(): BindingTarget<TaskListModelValidator> | undefined {
        this.context.bind(EntityValidator).toSelf();
        this.context.bind(WeakEntityValidator).toSelf();
        this.context.bind(RelationValidator).toSelf();
        this.context.bind(AttributeValidator).toSelf();
        this.context.bind(KeyAttributeValidator).toSelf();
        this.context.bind(AlternativeKeyAttributeValidator).toSelf();
        this.context.bind(DerivedAttributeValidator).toSelf();
        this.context.bind(MultiValuedAttributeValidator).toSelf();
        this.context.bind(ExistenceDependenceRelationValidator).toSelf();
        this.context.bind(IdentifyingDependenceRelationValidator).toSelf();
        this.context.bind(AllSpecializationsValidator).toSelf();
        this.context.bind(TaskListModelValidator).toSelf().inSingletonScope();
        this.context.bind(SQLGenerator).toSelf().inSingletonScope();
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
