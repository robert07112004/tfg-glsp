import {
    Point
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { PartialOverlappedSpecialization } from '../../../model/er-model';
import { BaseCreateNodeHandler } from '../base-create-node-handler';

@injectable()
export class CreatePartialOverlappedSpecializationNodeHandler extends BaseCreateNodeHandler<PartialOverlappedSpecialization> {
    readonly elementTypeIds = ['node:partialOverlappedSpecialization'];
    readonly label = 'Partial-Overlapped-Specialization';

    protected readonly nodeType = 'partialOverlappedSpecialization';
    protected readonly namePrefix = 'PartialOverlapped';

    protected getTargetArray(): PartialOverlappedSpecialization[] {
        return this.modelState.sourceModel.partialOverlappedSpecializations;
    }

    protected setTargetArray(array: PartialOverlappedSpecialization[]): void {
        this.modelState.sourceModel.partialOverlappedSpecializations = array;
    }

    protected override createErNode(position: Point, currentCount: number): PartialOverlappedSpecialization {
        const node = super.createErNode(position, currentCount);
        node.name = 'Partial Overlapped';
        return node;
    }
}