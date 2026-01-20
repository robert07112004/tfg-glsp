import { Command, CreateEdgeOperation, JsonCreateEdgeOperationHandler, MaybePromise } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { InclusionEdge } from '../../model/tasklist-model';
import { TaskListModelState } from '../../model/tasklist-model-state';

@injectable()
export class CreateInclusionEdgeHandler extends JsonCreateEdgeOperationHandler {
    readonly elementTypeIds = ['edge:inclusion'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: CreateEdgeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const inclusionEdge: InclusionEdge = {
                id: uuid.v4(),
                type: 'edge:inclusion',
                sourceId: operation.sourceElementId,
                targetId: operation.targetElementId,
            };
            this.modelState.sourceModel.inclusionEdges.push(inclusionEdge);
        });
    }


    get label(): string {
        return 'Inclusion Constraint';
    }
}