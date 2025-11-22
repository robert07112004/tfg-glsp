import {
    Command,
    CreateNodeOperation,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { DerivedAttribute } from '../../../model/tasklist-model';
import { TaskListModelState } from '../../../model/tasklist-model-state';

@injectable()
export class CreateDerivedAttributeHandler extends JsonCreateNodeOperationHandler {
    readonly elementTypeIds = ['node:derivedAttribute'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;
            const derivedAttribute = this.createDerivedAttribute(relativeLocation);
            const taskList = this.modelState.sourceModel;
            taskList.derivedAttributes.push(derivedAttribute);
        });
    }

    protected createDerivedAttribute(position: Point): DerivedAttribute {
        const attributeCounter = this.modelState.sourceModel.derivedAttributes.length;
        return {
            id: uuid.v4(),
            type: 'derivedAttribute',
            name: `NewDerivedAttribute${attributeCounter + 1}: integer`,
            equation: 'Equation of Derived Attribute',
            position
        };
    }

    get label(): string {
        return 'Derived Attribute';
    }
}