import {
    Point
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { IdentifyingDependentRelation } from '../../../model/er-model';
import { BaseCreateNodeHandler } from '../base-create-node-handler';

@injectable()
export class CreateIdentifyingDependentRelationHandler extends BaseCreateNodeHandler<IdentifyingDependentRelation> {
    readonly elementTypeIds = ['node:identifyingDependentRelation'];
    readonly label = 'Identifying-Dep Relation';

    protected readonly nodeType = 'identifyingDependentRelation';
    protected readonly namePrefix = 'NewIdentRelation';

    protected getTargetArray(): IdentifyingDependentRelation[] {
        return this.modelState.sourceModel.identifyingDependentRelations;
    }

    protected setTargetArray(array: IdentifyingDependentRelation[]): void {
        this.modelState.sourceModel.identifyingDependentRelations = array;
    }

    protected override createErNode(position: Point, currentCount: number): IdentifyingDependentRelation {
        const node = super.createErNode(position, currentCount);
        node.cardinality = '-';
        node.dependencyLabel = 'Id';
        return node;
    }
}