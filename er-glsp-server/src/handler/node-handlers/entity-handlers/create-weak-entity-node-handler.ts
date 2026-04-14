import {
    Command,
    CreateNodeOperation,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { WeakEntity } from '../../../model/er-model';
import { ErModelState } from '../../../model/er-model-state';

@injectable()
export class CreateWeakEntityHandler extends JsonCreateNodeOperationHandler {
    readonly elementTypeIds = ['node:weakEntity'];

    @inject(ErModelState)
    protected override modelState: ErModelState;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;
            const weakEntity = this.createWeakEntity(relativeLocation);
            const taskList = this.modelState.sourceModel;
            taskList.weakEntities.push(weakEntity);
        });
    }

    protected createWeakEntity(position: Point): WeakEntity {
        const entityCounter = this.modelState.sourceModel.weakEntities.length;
        return {
            id: uuid.v4(),
            type: 'weakEntity',
            name: `NewWeakEntity${entityCounter + 1}`,
            position
        };
    }

    get label(): string {
        return 'Weak Entity';
    }
}