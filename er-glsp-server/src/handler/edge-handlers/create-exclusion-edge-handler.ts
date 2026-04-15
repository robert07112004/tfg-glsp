import { injectable } from 'inversify';
import { ExclusionEdge } from '../../model/er-model';
import { BaseCreateEdgeHandler } from './base-create-edge-handler';

@injectable()
export class CreateExclusionEdgeHandler extends BaseCreateEdgeHandler<ExclusionEdge> {
    readonly elementTypeIds = ['edge:exclusion'];
    readonly label = 'Exclusion Constraint';
    protected readonly edgeType = 'edge:exclusion';

    protected getTargetArray(): ExclusionEdge[] { return this.modelState.sourceModel.exclusionEdges; }
    protected setTargetArray(array: ExclusionEdge[]): void { this.modelState.sourceModel.exclusionEdges = array; }
}