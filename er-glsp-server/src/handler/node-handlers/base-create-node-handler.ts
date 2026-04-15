import {
    Command,
    CreateNodeOperation,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { ErNode } from '../../model/er-model';
import { ErModelState } from '../../model/er-model-state';

@injectable()
export abstract class BaseCreateNodeHandler<T extends ErNode> extends JsonCreateNodeOperationHandler {
    @inject(ErModelState)
    protected override modelState: ErModelState;

    abstract override  get elementTypeIds(): string[];
    abstract override  get label(): string;
    protected abstract get nodeType(): T['type'];
    protected abstract get namePrefix(): string;

    protected abstract getTargetArray(): T[];

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;

            let targetArray = this.getTargetArray();

            if (!targetArray) {
                targetArray = [];
                this.setTargetArray(targetArray);
            }

            const newNode = this.createErNode(relativeLocation, targetArray.length);
            targetArray.push(newNode);
        });
    }

    protected abstract setTargetArray(array: T[]): void;

    protected createErNode(position: Point, currentCount: number): T {
        return {
            id: uuid.v4(),
            type: this.nodeType,
            name: `${this.namePrefix}${currentCount + 1}`,
            position
        } as unknown as T;
    }
}