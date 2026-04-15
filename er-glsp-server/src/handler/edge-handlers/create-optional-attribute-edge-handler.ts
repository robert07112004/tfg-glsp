import { injectable } from 'inversify';
import { OptionalAttributeEdge } from '../../model/er-model';
import { BaseCreateEdgeHandler } from './base-create-edge-handler';

@injectable()
export class CreateOptionalAttributeEdgeHandler extends BaseCreateEdgeHandler<OptionalAttributeEdge> {
    readonly elementTypeIds = ['edge:optional'];
    readonly label = 'Optional Attribute Link';
    protected readonly edgeType = 'edge:optional';

    protected getTargetArray(): OptionalAttributeEdge[] { return this.modelState.sourceModel.optionalAttributeEdges; }
    protected setTargetArray(array: OptionalAttributeEdge[]): void { this.modelState.sourceModel.optionalAttributeEdges = array; }
}