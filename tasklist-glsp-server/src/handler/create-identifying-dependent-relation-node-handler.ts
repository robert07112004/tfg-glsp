import {
    Command,
    CreateNodeOperation,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { IdentifyingDependentRelation } from '../model/tasklist-model';
import { TaskListModelState } from '../model/tasklist-model-state';

@injectable()
export class CreateIdentifyingDependentRelationHandler extends JsonCreateNodeOperationHandler {
    readonly elementTypeIds = ['node:identifyingDependentRelation'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;
            const relation = this.createRelation(relativeLocation);
            const taskList = this.modelState.sourceModel;
            taskList.identifyingDependentRelations.push(relation);
        });
    }

    protected createRelation(position: Point): IdentifyingDependentRelation {
        const relationCounter = this.modelState.sourceModel.existenceDependentRelations.length;
        return {
            id: uuid.v4(),
            type: 'identifyingDependentRelation',
            name: `NewIdentRelation${relationCounter + 1}`,
            cardinality: '-',
            dependencyLabel: 'Id',
            position
        };
    }

    get label(): string {
        return 'Identifying-Dep Relation';
    }
}