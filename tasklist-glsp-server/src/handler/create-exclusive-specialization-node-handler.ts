import {
    Command,
    CreateNodeOperation,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { ExclusiveSpecialization } from '../model/tasklist-model';
import { TaskListModelState } from '../model/tasklist-model-state';

@injectable()
export class CreateExclusiveSpecializationNodeHandler extends JsonCreateNodeOperationHandler {
    readonly elementTypeIds = ['node:exclusiveSpecialization'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;
            const exclusiveSpecialization = this.createExclusiveSpecialization(relativeLocation);
            const taskList = this.modelState.sourceModel;
            taskList.exclusiveSpecializations.push(exclusiveSpecialization);
        });
    }

    protected createExclusiveSpecialization(position: Point): ExclusiveSpecialization {
        const relationCounter = this.modelState.sourceModel.exclusiveSpecializations.length;
        return {
            id: uuid.v4(),
            type: 'exclusiveSpecialization',
            name: `NewExSpecialization${relationCounter + 1}`,
            position
        };
    }

    get label(): string {
        return 'Exclusive Specialization';
    }

}