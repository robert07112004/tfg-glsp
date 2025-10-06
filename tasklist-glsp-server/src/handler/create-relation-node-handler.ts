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
import { Relation } from '../model/tasklist-model';
import { TaskListModelState } from '../model/tasklist-model-state';

@injectable()
export class CreateRelationHandler extends JsonCreateNodeOperationHandler {
    readonly elementTypeIds = ['node:relation'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;
            const relation = this.createRelation(relativeLocation);
            const taskList = this.modelState.sourceModel;
            if (!taskList.relations) taskList.relations = [];
            taskList.relations.push(relation);
        });
    }

    protected createRelation(position: Point): Relation {
        const nodeCounter = this.modelState.index.getAllByClass(GNode).length;
        return {
            id: uuid.v4(),
            name: `NewRelationNode${nodeCounter}`,
            position
        };
    }

    get label(): string {
        return 'Relation';
    }
    
}