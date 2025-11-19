import {
    Command,
    CreateNodeOperation,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { MultiValuedAttribute } from '../../../model/tasklist-model';
import { TaskListModelState } from '../../../model/tasklist-model-state';

@injectable()
export class CreateMultiValuedAttributeHandler extends JsonCreateNodeOperationHandler {
    readonly elementTypeIds = ['node:multiValuedAttribute'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;
            const multiValuedAttribute = this.createMultiValuedAttribute(relativeLocation);
            const taskList = this.modelState.sourceModel;
            taskList.multiValuedAttributes.push(multiValuedAttribute);
        });
    }

    protected createMultiValuedAttribute(position: Point): MultiValuedAttribute {
        const attributeCounter = this.modelState.sourceModel.multiValuedAttributes.length;
        return {
            id: uuid.v4(),
            type: 'multiValuedAttribute',
            name: `NewMultiValuedAttribute${attributeCounter + 1}: int`,
            position
        };
    }

    get label(): string {
        return 'Multi-valued Attribute';
    }
}