import { injectable } from 'inversify';
import { InclusionEdge } from '../../model/er-model';
import { BaseCreateEdgeHandler } from './base-create-edge-handler';

@injectable()
export class CreateInclusionEdgeHandler extends BaseCreateEdgeHandler<InclusionEdge> {
    readonly elementTypeIds = ['edge:inclusion'];
    readonly label = 'Inclusion Constraint';
    protected readonly edgeType = 'edge:inclusion';

    protected getTargetArray(): InclusionEdge[] { return this.modelState.sourceModel.inclusionEdges; }
    protected setTargetArray(array: InclusionEdge[]): void { this.modelState.sourceModel.inclusionEdges = array; }
}