import { injectable } from 'inversify';
import { WeakEntity } from '../../../model/er-model';
import { BaseCreateNodeHandler } from '../base-create-node-handler';

@injectable()
export class CreateWeakEntityHandler extends BaseCreateNodeHandler<WeakEntity> {
    readonly elementTypeIds = ['node:weakEntity'];
    readonly label = 'Weak Entity';

    protected readonly nodeType = 'weakEntity';
    protected readonly namePrefix = 'NewWeakEntity';

    protected getTargetArray(): WeakEntity[] {
        return this.modelState.sourceModel.weakEntities;
    }

    protected setTargetArray(array: WeakEntity[]): void {
        this.modelState.sourceModel.weakEntities = array;
    }
}