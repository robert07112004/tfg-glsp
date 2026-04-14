import {
    Command,
    CreateNodeOperation,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { PartialExclusiveSpecialization } from '../../../model/er-model';
import { ErModelState } from '../../../model/er-model-state';

@injectable()
export class CreatePartialExclusiveSpecializationNodeHandler extends JsonCreateNodeOperationHandler {
    readonly elementTypeIds = ['node:partialExclusiveSpecialization'];

    @inject(ErModelState)
    protected override modelState: ErModelState;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;
            const partialExclusiveSpecialization = this.createPartialExclusiveSpecialization(relativeLocation);
            const taskList = this.modelState.sourceModel;
            taskList.partialExclusiveSpecializations.push(partialExclusiveSpecialization);
        });
    }

    protected createPartialExclusiveSpecialization(position: Point): PartialExclusiveSpecialization {
        return {
            id: uuid.v4(),
            type: 'partialExclusiveSpecialization',
            name: 'Partial Exclusive',
            position
        };
    }

    get label(): string {
        return 'Partial-Exclusive-Specialization';
    }

}