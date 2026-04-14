import {
    Command,
    CreateNodeOperation,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { PartialOverlappedSpecialization } from '../../../model/er-model';
import { ErModelState } from '../../../model/er-model-state';

@injectable()
export class CreatePartialOverlappedSpecializationNodeHandler extends JsonCreateNodeOperationHandler {
    readonly elementTypeIds = ['node:partialOverlappedSpecialization'];

    @inject(ErModelState)
    protected override modelState: ErModelState;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;
            const partialOverlappedSpecialization = this.createPartialOverlappedSpecialization(relativeLocation);
            const taskList = this.modelState.sourceModel;
            taskList.partialOverlappedSpecializations.push(partialOverlappedSpecialization);
        });
    }

    protected createPartialOverlappedSpecialization(position: Point): PartialOverlappedSpecialization {
        return {
            id: uuid.v4(),
            type: 'partialOverlappedSpecialization',
            name: 'Partial Overlapped',
            position
        };
    }

    get label(): string {
        return 'Partial-Overlapped-Specialization';
    }

}