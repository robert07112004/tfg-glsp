import { injectable } from 'inversify';
import { OverlappingEdge } from '../../model/er-model';
import { BaseCreateEdgeHandler } from './base-create-edge-handler';

@injectable()
export class CreateOverlappingEdgeHandler extends BaseCreateEdgeHandler<OverlappingEdge> {
    readonly elementTypeIds = ['edge:overlap'];
    readonly label = 'Overlapping Constraint';
    protected readonly edgeType = 'edge:overlap';

    protected getTargetArray(): OverlappingEdge[] { return this.modelState.sourceModel.overlappingEdges; }
    protected setTargetArray(array: OverlappingEdge[]): void { this.modelState.sourceModel.overlappingEdges = array; }
}