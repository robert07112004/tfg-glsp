import {
    Point
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { DerivedAttribute } from '../../../model/er-model';
import { BaseCreateNodeHandler } from '../base-create-node-handler';

@injectable()
export class CreateDerivedAttributeHandler extends BaseCreateNodeHandler<DerivedAttribute> {
    readonly elementTypeIds = ['node:derivedAttribute'];
    readonly label = 'Derived Attribute';

    protected readonly nodeType = 'derivedAttribute';
    protected readonly namePrefix = 'NewDerivedAttribute';

    protected getTargetArray(): DerivedAttribute[] {
        return this.modelState.sourceModel.derivedAttributes;
    }

    protected setTargetArray(array: DerivedAttribute[]): void {
        this.modelState.sourceModel.derivedAttributes = array;
    }

    protected override createErNode(position: Point, currentCount: number): DerivedAttribute {
        const node = super.createErNode(position, currentCount);

        node.name = `${this.namePrefix}${currentCount + 1}: integer`;
        node.equation = 'Equation of Derived Attribute';

        return node;
    }
}