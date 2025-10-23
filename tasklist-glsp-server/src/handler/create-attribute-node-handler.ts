import {
    Command,
    CreateNodeOperation,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { Attribute } from '../model/tasklist-model';
import { TaskListModelState } from '../model/tasklist-model-state';

@injectable()
export class CreateAttributeHandler extends JsonCreateNodeOperationHandler {
    readonly elementTypeIds = ['node:attribute'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;
            const attribute = this.createAttribute(relativeLocation);
            const taskList = this.modelState.sourceModel;
            taskList.attributes.push(attribute);
        });
    }

    protected createAttribute(position: Point): Attribute {
        const attributeCounter = this.modelState.sourceModel.attributes.length;
        return {
            id: uuid.v4(),
            type: 'attribute',
            name: `NewAttribute${attributeCounter + 1}`,
            position
        };
    }

    get label(): string {
        return 'Attribute';
    }
}