import {
    Point
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { MultiValuedAttribute } from '../../../model/er-model';
import { BaseCreateNodeHandler } from '../base-create-node-handler';

@injectable()
export class CreateMultiValuedAttributeHandler extends BaseCreateNodeHandler<MultiValuedAttribute> {
    readonly elementTypeIds = ['node:multiValuedAttribute'];
    readonly label = 'Multi-valued Attribute';

    protected readonly nodeType = 'multiValuedAttribute';
    protected readonly namePrefix = 'NewMultiValuedAttribute';

    protected getTargetArray(): MultiValuedAttribute[] {
        return this.modelState.sourceModel.multiValuedAttributes;
    }

    protected setTargetArray(array: MultiValuedAttribute[]): void {
        this.modelState.sourceModel.multiValuedAttributes = array;
    }

    protected override createErNode(position: Point, currentCount: number): MultiValuedAttribute {
        const node = super.createErNode(position, currentCount);
        node.name = `${this.namePrefix}${currentCount + 1}: integer`;
        return node;
    }
}