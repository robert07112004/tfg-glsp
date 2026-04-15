import {
    Point
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { TotalExclusiveSpecialization } from '../../../model/er-model';
import { BaseCreateNodeHandler } from '../base-create-node-handler';

@injectable()
export class CreateTotalExclusiveSpecializationNodeHandler extends BaseCreateNodeHandler<TotalExclusiveSpecialization> {
    readonly elementTypeIds = ['node:totalExclusiveSpecialization'];
    readonly label = 'Total-Exclusive-Specialization';

    protected readonly nodeType = 'totalExclusiveSpecialization';
    protected readonly namePrefix = 'TotalExclusive';

    protected getTargetArray(): TotalExclusiveSpecialization[] {
        return this.modelState.sourceModel.totalExclusiveSpecializations;
    }

    protected setTargetArray(array: TotalExclusiveSpecialization[]): void {
        this.modelState.sourceModel.totalExclusiveSpecializations = array;
    }

    protected override createErNode(position: Point, currentCount: number): TotalExclusiveSpecialization {
        const node = super.createErNode(position, currentCount);
        node.name = 'Total Exclusive';
        return node;
    }
}