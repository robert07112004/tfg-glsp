import { DefaultTypes } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { Transition } from '../../model/er-model';
import { BaseCreateEdgeHandler } from './base-create-edge-handler';

@injectable()
export class CreateTransitionHandler extends BaseCreateEdgeHandler<Transition> {
    readonly elementTypeIds = [DefaultTypes.EDGE];
    readonly label = 'Transition';
    protected readonly edgeType = 'transition';

    protected getTargetArray(): Transition[] { return this.modelState.sourceModel.transitions; }
    protected setTargetArray(array: Transition[]): void { this.modelState.sourceModel.transitions = array; }
}
