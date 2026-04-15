import {
    Command,
    CreateEdgeOperation,
    JsonCreateEdgeOperationHandler,
    MaybePromise
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { ErEdge } from '../../model/er-model';
import { ErModelState } from '../../model/er-model-state';

@injectable()
export abstract class BaseCreateEdgeHandler<T extends ErEdge> extends JsonCreateEdgeOperationHandler {
    @inject(ErModelState)
    protected override modelState: ErModelState;

    abstract override get elementTypeIds(): string[];
    abstract override get label(): string;
    protected abstract get edgeType(): T['type'];

    protected abstract getTargetArray(): T[] | undefined;
    protected abstract setTargetArray(array: T[]): void;

    override createCommand(operation: CreateEdgeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            let targetArray = this.getTargetArray();

            if (!targetArray) {
                targetArray = [];
                this.setTargetArray(targetArray);
            }

            const newEdge = this.createErEdge(operation.sourceElementId, operation.targetElementId);
            targetArray.push(newEdge);
        });
    }

    protected createErEdge(sourceId: string, targetId: string): T {
        return {
            id: uuid.v4(),
            type: this.edgeType,
            sourceId,
            targetId
        } as unknown as T;
    }
}