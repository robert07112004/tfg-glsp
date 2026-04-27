import {
    Point
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { ExistenceDependentRelation } from '../../../model/er-model';
import { BaseCreateNodeHandler } from '../base-create-node-handler';

@injectable()
export class CreateExistenceDependentRelationHandler extends BaseCreateNodeHandler<ExistenceDependentRelation> {
    readonly elementTypeIds = ['node:existenceDependentRelation'];
    readonly label = 'Existence-Dep Relation';

    protected readonly nodeType = 'existenceDependentRelation';
    protected readonly namePrefix = 'NewDepRelation';

    protected getTargetArray(): ExistenceDependentRelation[] {
        return this.modelState.sourceModel.existenceDependentRelations;
    }

    protected setTargetArray(array: ExistenceDependentRelation[]): void {
        this.modelState.sourceModel.existenceDependentRelations = array;
    }

    protected override createErNode(position: Point, currentCount: number): ExistenceDependentRelation {
        const node = super.createErNode(position, currentCount);
        node.dependencyLabel = 'E';
        return node;
    }
}