import { Command, CreateEdgeOperation, JsonCreateEdgeOperationHandler, MaybePromise } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { OverlappingEdge } from '../../model/tasklist-model';
import { TaskListModelState } from '../../model/tasklist-model-state';

@injectable()
export class CreateOverlappingEdgeHandler extends JsonCreateEdgeOperationHandler {
    readonly elementTypeIds = ['edge:overlap'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: CreateEdgeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            if (!this.modelState.sourceModel.overlappingEdges) {
                this.modelState.sourceModel.overlappingEdges = [];
            }
            const overlappingEdge: OverlappingEdge = {
                id: uuid.v4(),
                type: 'edge:overlap',
                sourceId: operation.sourceElementId,
                targetId: operation.targetElementId
            };
            this.modelState.sourceModel.overlappingEdges.push(overlappingEdge);
        });
    }

    get label(): string {
        return 'Overlapping Constraint';
    }
}