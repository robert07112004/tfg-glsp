import {
    ChangeRoutingPointsOperation,
    Command,
    JsonOperationHandler,
    MaybePromise
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ErModel } from '../model/er-model';
import { ErModelState } from '../model/er-model-state';

@injectable()
export class ErChangeRoutingPointsHandler extends JsonOperationHandler {
    readonly operationType = ChangeRoutingPointsOperation.KIND;

    @inject(ErModelState)
    protected override modelState: ErModelState;

    override createCommand(operation: ChangeRoutingPointsOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const sourceModel = this.modelState.sourceModel as ErModel;

            for (const change of operation.newRoutingPoints) {
                const edgeId = change.elementId;

                const allEdges = [
                    ...sourceModel.transitions || [],
                    ...sourceModel.weightedEdges || [],
                    ...sourceModel.optionalAttributeEdges || []
                ];

                const edge = allEdges.find(e => e.id === edgeId);

                if (edge) edge.routingPoints = change.newRoutingPoints;
            }
        });
    }
}