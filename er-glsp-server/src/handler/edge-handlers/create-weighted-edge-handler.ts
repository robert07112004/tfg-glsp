import { injectable } from 'inversify';
import { WeightedEdge } from '../../model/er-model';
import { BaseCreateEdgeHandler } from './base-create-edge-handler';

@injectable()
export class CreateWeightedEdgeHandler extends BaseCreateEdgeHandler<WeightedEdge> {
    readonly elementTypeIds = ['weighted-edge'];
    readonly label = 'Weighted Edge';
    protected readonly edgeType = 'edge:weighted';

    protected getTargetArray(): WeightedEdge[] { return this.modelState.sourceModel.weightedEdges; }
    protected setTargetArray(array: WeightedEdge[]): void { this.modelState.sourceModel.weightedEdges = array; }

    protected override createErEdge(sourceId: string, targetId: string): WeightedEdge {
        const edge = super.createErEdge(sourceId, targetId);
        edge.description = 'New Weighted Edge';
        return edge;
    }
}