import {
    Command,
    CreateEdgeOperation,
    JsonCreateEdgeOperationHandler,
    MaybePromise
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { OptionalAttributeEdge } from '../../model/er-model';
import { ErModelState } from '../../model/er-model-state';

@injectable()
export class CreateOptionalAttributeEdgeHandler extends JsonCreateEdgeOperationHandler {
    readonly elementTypeIds = ['edge:optional'];

    @inject(ErModelState)
    protected override modelState: ErModelState;

    override createCommand(operation: CreateEdgeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
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