import {
    Point
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { TotalOverlappedSpecialization } from '../../../model/er-model';
import { BaseCreateNodeHandler } from '../base-create-node-handler';

@injectable()
export class CreateTotalOverlappedSpecializationNodeHandler extends BaseCreateNodeHandler<TotalOverlappedSpecialization> {
    readonly elementTypeIds = ['node:totalOverlappedSpecialization'];
    readonly label = 'Total-Overlapped-Specialization';

    protected readonly nodeType = 'totalOverlappedSpecialization';
    protected readonly namePrefix = 'TotalOverlapped';

    protected getTargetArray(): TotalOverlappedSpecialization[] {
        return this.modelState.sourceModel.totalOverlappedSpecializations;
    }

    protected setTargetArray(array: TotalOverlappedSpecialization[]): void {
        this.modelState.sourceModel.totalOverlappedSpecializations = array;
    }

    protected override createErNode(position: Point, currentCount: number): TotalOverlappedSpecialization {
        const node = super.createErNode(position, currentCount);
        node.name = 'Total Overlapped';
        return node;
    }
}