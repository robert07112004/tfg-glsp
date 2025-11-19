import {
    Command,
    CreateNodeOperation,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { PartialOverlappedSpecialization } from '../../../model/tasklist-model';
import { TaskListModelState } from '../../../model/tasklist-model-state';

@injectable()
export class CreatePartialOverlappedSpecializationNodeHandler extends JsonCreateNodeOperationHandler {
    readonly elementTypeIds = ['node:partialOverlappedSpecialization'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;
            const partialOverlappedSpecialization = this.createPartialOverlappedSpecialization(relativeLocation);
            const taskList = this.modelState.sourceModel;
            taskList.partialOverlappedSpecializations.push(partialOverlappedSpecialization);
        });
    }

    protected createPartialOverlappedSpecialization(position: Point): PartialOverlappedSpecialization {
        const partialOverlappedSpecialization = this.modelState.sourceModel.partialOverlappedSpecializations.length;
        return {
            id: uuid.v4(),
            type: 'partialOverlappedSpecialization',
            name: `NewPartialOvSpecialization${partialOverlappedSpecialization + 1}`,
            position
        };
    }

    get label(): string {
        return 'Partial-Overlapped-Specialization';
    }

}