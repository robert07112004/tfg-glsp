import {
    Command,
    CreateNodeOperation,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { AlternativeKeyAttribute } from '../../../model/tasklist-model';
import { TaskListModelState } from '../../../model/tasklist-model-state';

@injectable()
export class CreateAlternativeKeyAttributeHandler extends JsonCreateNodeOperationHandler {
    readonly elementTypeIds = ['node:alternativeKeyAttribute'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;
            const alternativeKeyAttribute = this.createAlternativeKeyAttribute(relativeLocation);
            const taskList = this.modelState.sourceModel;
            taskList.alternativeKeyAttributes.push(alternativeKeyAttribute);
        });
    }

    protected createAlternativeKeyAttribute(position: Point): AlternativeKeyAttribute {
        const attributeCounter = this.modelState.sourceModel.keyAttributes.length;
        return {
            id: uuid.v4(),
            type: 'alternativeKeyAttribute',
            name: `NewAlternativeKeyAttribute${attributeCounter + 1}: integer`,
            position
        };
    }

    get label(): string {
        return 'Alternative Key Attribute';
    }
}