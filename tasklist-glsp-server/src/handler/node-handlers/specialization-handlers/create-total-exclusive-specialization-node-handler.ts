import {
    Command,
    CreateNodeOperation,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { TotalExclusiveSpecialization } from '../../../model/tasklist-model';
import { TaskListModelState } from '../../../model/tasklist-model-state';

@injectable()
export class CreateTotalExclusiveSpecializationNodeHandler extends JsonCreateNodeOperationHandler {
    readonly elementTypeIds = ['node:totalExclusiveSpecialization'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;
            const totalExclusiveSpecialization = this.createTotalExclusiveSpecialization(relativeLocation);
            const taskList = this.modelState.sourceModel;
            taskList.totalExclusiveSpecializations.push(totalExclusiveSpecialization);
        });
    }

    protected createTotalExclusiveSpecialization(position: Point): TotalExclusiveSpecialization {
        return {
            id: uuid.v4(),
            type: 'totalExclusiveSpecialization',
            name: 'Total Exclusive',
            position
        };
    }

    get label(): string {
        return 'Total-Exclusive-Specialization';
    }

}