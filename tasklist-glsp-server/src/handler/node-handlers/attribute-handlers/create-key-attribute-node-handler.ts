import {
    Command,
    CreateNodeOperation,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { KeyAttribute } from '../../../model/tasklist-model';
import { TaskListModelState } from '../../../model/tasklist-model-state';

@injectable()
export class CreateKeyAttributeHandler extends JsonCreateNodeOperationHandler {
    readonly elementTypeIds = ['node:keyAttribute'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;
            const keyAttribute = this.createKeyAttribute(relativeLocation);
            const taskList = this.modelState.sourceModel;
            taskList.keyAttributes.push(keyAttribute);
        });
    }

    protected createKeyAttribute(position: Point): KeyAttribute {
        const attributeCounter = this.modelState.sourceModel.keyAttributes.length;
        return {
            id: uuid.v4(),
            type: 'keyAttribute',
            name: `NewKeyAttribute${attributeCounter + 1}: integer`,
            position
        };
    }

    get label(): string {
        return 'Key Attribute';
    }
}