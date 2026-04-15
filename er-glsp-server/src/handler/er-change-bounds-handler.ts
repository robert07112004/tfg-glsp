import { ChangeBoundsOperation, Command, Dimension, GNode, JsonOperationHandler, MaybePromise, Point } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ErModelState } from '../model/er-model-state';

@injectable()
export class ErChangeBoundsHandler extends JsonOperationHandler {
    readonly operationType = ChangeBoundsOperation.KIND;

    @inject(ErModelState)
    protected override modelState: ErModelState;

    override createCommand(operation: ChangeBoundsOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            operation.newBounds.forEach(element => this.changeElementBounds(element.elementId, element.newSize, element.newPosition));
        });
    }

    protected changeElementBounds(elementId: string, newSize: Dimension, newPosition?: Point): void {
        const gNode = this.modelState.index.findByClass(elementId, GNode);
        if (!gNode) return;

        const modelElement = this.findResizableElement(gNode.id);
        if (!modelElement) return;

        modelElement.size = newSize;
        if (newPosition) {
            modelElement.position = newPosition;
        }
    }

    private findResizableElement(id: string) {
        const idx = this.modelState.index;
        return (
            idx.findEntity(id) ??
            idx.findWeakEntity(id) ??
            idx.findRelation(id) ??
            idx.findExistenceDependentRelation(id) ??
            idx.findIdentifyingDependentRelation(id) ??
            idx.findPartialExlcusiveSpecialization(id) ??
            idx.findTotalExclusiveSpecialization(id) ??
            idx.findPartialOverlappedSpecialization(id) ??
            idx.findTotalOverlappedSpecialization(id) ??
            idx.findAttribute(id) ??
            idx.findMultiValuedAttribute(id) ??
            idx.findDerivedAttribute(id) ??
            idx.findKeyAttribute(id) ??
            idx.findAlternativeKeyAttribute(id)
        );
    }
}
