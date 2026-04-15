import {
    DefaultTypes
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { Entity } from '../../../model/er-model';
import { BaseCreateNodeHandler } from '../base-create-node-handler';

@injectable()
export class CreateEntityHandler extends BaseCreateNodeHandler<Entity> {
    readonly elementTypeIds = [DefaultTypes.NODE_RECTANGLE];
    readonly label = 'Entity';

    protected readonly nodeType = 'entity';
    protected readonly namePrefix = 'NewEntity';

    protected getTargetArray(): Entity[] {
        return this.modelState.sourceModel.entities;
    }

    protected setTargetArray(array: Entity[]): void {
        this.modelState.sourceModel.entities = array;
    }
}