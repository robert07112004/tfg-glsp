import {
    Point
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { PartialExclusiveSpecialization } from '../../../model/er-model';
import { BaseCreateNodeHandler } from '../base-create-node-handler';

@injectable()
export class CreatePartialExclusiveSpecializationNodeHandler extends BaseCreateNodeHandler<PartialExclusiveSpecialization> {
    readonly elementTypeIds = ['node:partialExclusiveSpecialization'];
    readonly label = 'Partial-Exclusive-Specialization';

    protected readonly nodeType = 'partialExclusiveSpecialization';
    protected readonly namePrefix = 'PartialExclusive';

    protected getTargetArray(): PartialExclusiveSpecialization[] {
        return this.modelState.sourceModel.partialExclusiveSpecializations;
    }

    protected setTargetArray(array: PartialExclusiveSpecialization[]): void {
        this.modelState.sourceModel.partialExclusiveSpecializations = array;
    }

    protected override createErNode(position: Point, currentCount: number): PartialExclusiveSpecialization {
        const node = super.createErNode(position, currentCount);
        node.name = 'Partial Exclusive';
        return node;
    }
}