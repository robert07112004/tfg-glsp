import {
    Command,
    CreateNodeOperation,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { ExistenceDependentRelation } from '../../../model/tasklist-model';
import { TaskListModelState } from '../../../model/tasklist-model-state';

@injectable()
export class CreateExistenceDependentRelationHandler extends JsonCreateNodeOperationHandler {
    readonly elementTypeIds = ['node:existenceDependentRelation'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;
            const relation = this.createRelation(relativeLocation);
            const taskList = this.modelState.sourceModel;
            taskList.existenceDependentRelations.push(relation);
        });
    }

    protected createRelation(position: Point): ExistenceDependentRelation {
        const relationCounter = this.modelState.sourceModel.existenceDependentRelations.length;
        return {
            id: uuid.v4(),
            type: 'existenceDependentRelation',
            name: `NewDepRelation${relationCounter + 1}`,
            cardinality: '-',
            dependencyLabel: 'E',
            position
        };
    }

    get label(): string {
        return 'Existence-Dep Relation';
    }
}