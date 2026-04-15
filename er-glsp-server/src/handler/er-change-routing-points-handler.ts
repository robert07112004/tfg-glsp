import {
    ChangeRoutingPointsOperation,
    Command,
    JsonOperationHandler,
    MaybePromise
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ErEdge } from '../model/er-model';
import { ErModelState } from '../model/er-model-state';

@injectable()
export class ErChangeRoutingPointsHandler extends JsonOperationHandler {
    readonly operationType = ChangeRoutingPointsOperation.KIND;

    @inject(ErModelState)
    protected override modelState: ErModelState;

    override createCommand(operation: ChangeRoutingPointsOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const index = this.modelState.index;

            for (const change of operation.newRoutingPoints) {
                const element = index.findElement(change.elementId);

                if (element && 'sourceId' in element) {
                    (element as ErEdge).routingPoints = change.newRoutingPoints;
                }
            }
        });
    }
}