import { Command, CreateEdgeOperation, JsonCreateEdgeOperationHandler, MaybePromise } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { ExclusivityEdge } from '../../model/tasklist-model';
import { TaskListModelState } from '../../model/tasklist-model-state';

@injectable()
export class CreateExclusivityEdgeHandler extends JsonCreateEdgeOperationHandler {
    readonly elementTypeIds = ['edge:exclusivity'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: CreateEdgeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            if (!this.modelState.sourceModel.exclusivityEdges) {
                this.modelState.sourceModel.exclusivityEdges = [];
            }
            const exclusivityEdge: ExclusivityEdge = {
                id: uuid.v4(),
                type: 'edge:exclusivity',
                sourceId: operation.sourceElementId,
                targetId: operation.targetElementId
            };
            this.modelState.sourceModel.exclusivityEdges.push(exclusivityEdge);
        });
    }

    get label(): string {
        return 'Exclusivity Link';
    }
}