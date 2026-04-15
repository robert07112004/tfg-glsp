import { injectable } from 'inversify';
import { DisjointnessEdge } from '../../model/er-model';
import { BaseCreateEdgeHandler } from './base-create-edge-handler';

@injectable()
export class CreateDisjointnessEdgeHandler extends BaseCreateEdgeHandler<DisjointnessEdge> {
    readonly elementTypeIds = ['edge:disjointness'];
    readonly label = 'Disjointness Constraint';
    protected readonly edgeType = 'edge:disjointness';

    protected getTargetArray(): DisjointnessEdge[] { return this.modelState.sourceModel.disjointnessEdges; }
    protected setTargetArray(array: DisjointnessEdge[]): void { this.modelState.sourceModel.disjointnessEdges = array; }
}