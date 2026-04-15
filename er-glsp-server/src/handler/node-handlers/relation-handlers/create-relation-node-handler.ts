import {
    DefaultTypes,
    Point
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { Relation } from '../../../model/er-model';
import { BaseCreateNodeHandler } from '../base-create-node-handler';

@injectable()
export class CreateRelationHandler extends BaseCreateNodeHandler<Relation> {
    readonly elementTypeIds = [DefaultTypes.NODE_DIAMOND];
    readonly label = 'Relation';

    protected readonly nodeType = 'relation';
    protected readonly namePrefix = 'NewRelationNode';

    protected getTargetArray(): Relation[] {
        return this.modelState.sourceModel.relations;
    }

    protected setTargetArray(array: Relation[]): void {
        this.modelState.sourceModel.relations = array;
    }

    protected override createErNode(position: Point, currentCount: number): Relation {
        const node = super.createErNode(position, currentCount);
        node.cardinality = '-';
        return node;
    }
}