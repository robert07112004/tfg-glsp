import {
    Command,
    CreateEdgeOperation,
    JsonCreateEdgeOperationHandler,
    MaybePromise
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { OptionalAttributeEdge } from '../model/tasklist-model';
import { TaskListModelState } from '../model/tasklist-model-state';

@injectable()
export class CreateOptionalAttributeEdgeHandler extends JsonCreateEdgeOperationHandler {
    readonly elementTypeIds = ['edge:optional'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: CreateEdgeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const sourceNode = this.modelState.index.get(operation.sourceElementId);
            const targetNode = this.modelState.index.get(operation.targetElementId);

            const sourceType = sourceNode?.type;
            const targetType = targetNode?.type;

            if (
                (sourceType === 'node:entity' && targetType === 'node:entity') ||
                (sourceType === 'node:relation' && targetType === 'node:relation')
            ) {
                return undefined;
            }
            
            const optionalAttributeEdge: OptionalAttributeEdge = {
                id: uuid.v4(),
                type: 'edge:optional',
                sourceId: operation.sourceElementId,
                targetId: operation.targetElementId
            }
            this.modelState.sourceModel.optionalAttributeEdges.push(optionalAttributeEdge);
        });
    }

    get label(): string {
        return 'Optional Attribute Link';
    }
}