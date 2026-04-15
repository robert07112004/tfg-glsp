import {
    Point
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { Attribute } from '../../../model/er-model';
import { BaseCreateNodeHandler } from '../base-create-node-handler';

@injectable()
export class CreateAttributeHandler extends BaseCreateNodeHandler<Attribute> {
    readonly elementTypeIds = ['node:attribute'];
    readonly label = 'Attribute';

    protected readonly nodeType = 'attribute';
    protected readonly namePrefix = 'NewAttribute';

    protected getTargetArray(): Attribute[] {
        return this.modelState.sourceModel.attributes;
    }

    protected setTargetArray(array: Attribute[]): void {
        this.modelState.sourceModel.attributes = array;
    }

    protected override createErNode(position: Point, currentCount: number): Attribute {
        const node = super.createErNode(position, currentCount);
        node.name = `${this.namePrefix}${currentCount + 1}: integer`;
        return node;
    }
}