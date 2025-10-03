import {
    Command,
    CreateNodeOperation,
    GNode,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { Milestone } from '../model/tasklist-model';
import { TaskListModelState } from '../model/tasklist-model-state';

@injectable()
export class CreateMilestonesHandler extends JsonCreateNodeOperationHandler {
    readonly elementTypeIds = ['milestone-node'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;
            const milestone: Milestone = this.createMilestone(relativeLocation);
            const taskList = this.modelState.sourceModel;
            if (!taskList.milestones) taskList.milestones = [];
            taskList.milestones.push(milestone);
        });
    }

    protected createMilestone(position: Point): Milestone {
        const nodeCounter = this.modelState.index.getAllByClass(GNode).length;
        return {
            id: uuid.v4(),
            name: `NewMilestoneNode${nodeCounter}`,
            position
        };
    }

    get label(): string {
        return 'Milestone';
    }
    
}