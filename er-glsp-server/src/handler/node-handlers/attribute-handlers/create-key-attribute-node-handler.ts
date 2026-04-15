import {
    Point
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { KeyAttribute } from '../../../model/er-model';
import { BaseCreateNodeHandler } from '../base-create-node-handler';

@injectable()
export class CreateKeyAttributeHandler extends BaseCreateNodeHandler<KeyAttribute> {
    readonly elementTypeIds = ['node:keyAttribute'];
    readonly label = 'Key Attribute';

    protected readonly nodeType = 'keyAttribute';
    protected readonly namePrefix = 'NewKeyAttribute';

    protected getTargetArray(): KeyAttribute[] {
        return this.modelState.sourceModel.keyAttributes;
    }

    protected setTargetArray(array: KeyAttribute[]): void {
        this.modelState.sourceModel.keyAttributes = array;
    }

    protected override createErNode(position: Point, currentCount: number): KeyAttribute {
        const node = super.createErNode(position, currentCount);
        node.name = `${this.namePrefix}${currentCount + 1}: integer`;
        return node;
    }
}