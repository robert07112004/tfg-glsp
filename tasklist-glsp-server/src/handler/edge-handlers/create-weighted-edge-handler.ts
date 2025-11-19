import { Command, CreateEdgeOperation, JsonCreateEdgeOperationHandler, MaybePromise } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { WeightedEdge } from '../../model/tasklist-model';
import { TaskListModelState } from '../../model/tasklist-model-state';

@injectable()
export class CreateWeightedEdgeHandler extends JsonCreateEdgeOperationHandler {
    readonly elementTypeIds = ['weighted-edge'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: CreateEdgeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const weightedEdge: WeightedEdge = {
                id: uuid.v4(),
                type: 'edge:weighted',
                sourceId: operation.sourceElementId,
                targetId: operation.targetElementId,
                description: 'New Weighted Edge'
            };
            this.modelState.sourceModel.weightedEdges.push(weightedEdge);
        });
    }


    get label(): string {
        return 'Weighted Edge';
    }
}
