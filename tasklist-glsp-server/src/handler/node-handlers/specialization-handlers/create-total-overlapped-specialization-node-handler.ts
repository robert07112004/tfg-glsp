import {
    Command,
    CreateNodeOperation,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { TotalOverlappedSpecialization } from '../../../model/tasklist-model';
import { TaskListModelState } from '../../../model/tasklist-model-state';

@injectable()
export class CreateTotalOverlappedSpecializationNodeHandler extends JsonCreateNodeOperationHandler {
    readonly elementTypeIds = ['node:totalOverlappedSpecialization'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;
            const totalOverlappedSpecialization = this.createTotalOverlappedSpecialization(relativeLocation);
            const taskList = this.modelState.sourceModel;
            taskList.totalOverlappedSpecializations.push(totalOverlappedSpecialization);
        });
    }

    protected createTotalOverlappedSpecialization(position: Point): TotalOverlappedSpecialization {
        const totalOverlappedSpecialization = this.modelState.sourceModel.totalOverlappedSpecializations.length;
        return {
            id: uuid.v4(),
            type: 'totalOverlappedSpecialization',
            name: `NewTotalOvSpecialization${totalOverlappedSpecialization + 1}`,
            position
        };
    }

    get label(): string {
        return 'Total-Overlapped-Specialization';
    }

}