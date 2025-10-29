import {
    Command,
    CreateNodeOperation,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { PartialExclusiveSpecialization } from '../model/tasklist-model';
import { TaskListModelState } from '../model/tasklist-model-state';

@injectable()
export class CreatePartialExclusiveSpecializationNodeHandler extends JsonCreateNodeOperationHandler {
    readonly elementTypeIds = ['node:partialExclusiveSpecialization'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;
            const partialExclusiveSpecialization = this.createExclusiveSpecialization(relativeLocation);
            const taskList = this.modelState.sourceModel;
            taskList.partialExclusiveSpecializations.push(partialExclusiveSpecialization);
        });
    }

    protected createExclusiveSpecialization(position: Point): PartialExclusiveSpecialization {
        const exclusiveSpecialization = this.modelState.sourceModel.partialExclusiveSpecializations.length;
        return {
            id: uuid.v4(),
            type: 'partialExclusiveSpecialization',
            name: `NewPartialExSpecialization${exclusiveSpecialization + 1}`,
            position
        };
    }

    get label(): string {
        return 'Partial-Exclusive-Specialization';
    }

}