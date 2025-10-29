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
            const partialExclusiveSpecialization = this.createPartialExclusiveSpecialization(relativeLocation);
            const taskList = this.modelState.sourceModel;
            taskList.partialExclusiveSpecializations.push(partialExclusiveSpecialization);
        });
    }

    protected createPartialExclusiveSpecialization(position: Point): PartialExclusiveSpecialization {
        const partialExclusiveSpecialization = this.modelState.sourceModel.partialExclusiveSpecializations.length;
        return {
            id: uuid.v4(),
            type: 'partialExclusiveSpecialization',
            name: `NewPartialExSpecialization${partialExclusiveSpecialization + 1}`,
            position
        };
    }

    get label(): string {
        return 'Partial-Exclusive-Specialization';
    }

}