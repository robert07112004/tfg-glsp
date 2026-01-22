import { Command, CreateEdgeOperation, JsonCreateEdgeOperationHandler, MaybePromise } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { ExclusionEdge } from '../../model/tasklist-model';
import { TaskListModelState } from '../../model/tasklist-model-state';

@injectable()
export class CreateExclusionEdgeHandler extends JsonCreateEdgeOperationHandler {
    readonly elementTypeIds = ['edge:exclusion'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: CreateEdgeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            if (!this.modelState.sourceModel.exclusionEdges) {
                this.modelState.sourceModel.exclusionEdges = [];
            }
            const exclusionEdge: ExclusionEdge = {
                id: uuid.v4(),
                type: 'edge:exclusion',
                sourceId: operation.sourceElementId,
                targetId: operation.targetElementId,
            };
            this.modelState.sourceModel.exclusionEdges.push(exclusionEdge);
        });
    }

    get label(): string {
        return 'Exclusion Constraint';
    }
}