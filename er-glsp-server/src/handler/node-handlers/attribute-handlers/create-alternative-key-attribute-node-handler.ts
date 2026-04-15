import {
    Point
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { AlternativeKeyAttribute } from '../../../model/er-model';
import { BaseCreateNodeHandler } from '../base-create-node-handler';

@injectable()
export class CreateAlternativeKeyAttributeHandler extends BaseCreateNodeHandler<AlternativeKeyAttribute> {
    readonly elementTypeIds = ['node:alternativeKeyAttribute'];
    readonly label = 'Alternative Key Attribute';

    protected readonly nodeType = 'alternativeKeyAttribute';
    protected readonly namePrefix = 'NewAlternativeKeyAttribute';

    protected getTargetArray(): AlternativeKeyAttribute[] {
        return this.modelState.sourceModel.alternativeKeyAttributes;
    }

    protected setTargetArray(array: AlternativeKeyAttribute[]): void {
        this.modelState.sourceModel.alternativeKeyAttributes = array;
    }

    protected override createErNode(position: Point, currentCount: number): AlternativeKeyAttribute {
        const node = super.createErNode(position, currentCount);
        node.name = `${this.namePrefix}${currentCount + 1}: integer`;
        return node;
    }
}