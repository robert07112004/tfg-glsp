import { Command, CreateEdgeOperation, JsonCreateEdgeOperationHandler, MaybePromise } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { DisjointnessEdge } from '../../model/er-model';
import { ErModelState } from '../../model/er-model-state';

@injectable()
export class CreateDisjointnessEdgeHandler extends JsonCreateEdgeOperationHandler {
    readonly elementTypeIds = ['edge:disjointness'];

    @inject(ErModelState)
    protected override modelState: ErModelState;

    override createCommand(operation: CreateEdgeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            if (!this.modelState.sourceModel.disjointnessEdges) {
                this.modelState.sourceModel.disjointnessEdges = [];
            }
            const disjointnessEdge: DisjointnessEdge = {
                id: uuid.v4(),
                type: 'edge:disjointness',
                sourceId: operation.sourceElementId,
                targetId: operation.targetElementId
            };
            this.modelState.sourceModel.disjointnessEdges.push(disjointnessEdge);
        });
    }

    get label(): string {
        return 'Disjointness Constraint';
    }
}