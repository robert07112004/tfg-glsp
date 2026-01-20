import { Command, CreateEdgeOperation, JsonCreateEdgeOperationHandler, MaybePromise } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { DisjointnessEdge } from '../../model/tasklist-model';
import { TaskListModelState } from '../../model/tasklist-model-state';

@injectable()
export class CreateDisjointnessEdgeHandler extends JsonCreateEdgeOperationHandler {
    readonly elementTypeIds = ['edge:disjointness'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

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