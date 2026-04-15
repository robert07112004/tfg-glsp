import { ApplyLabelEditOperation } from '@eclipse-glsp/protocol';
import { Command, GEdge, GLSPServerError, GNode, JsonOperationHandler, MaybePromise, toTypeGuard } from '@eclipse-glsp/server/node';
import { inject, injectable } from 'inversify';
import { DerivedAttribute, ErNode, WeightedEdge } from '../model/er-model';
import { ErModelState } from '../model/er-model-state';

@injectable()
export class ErApplyLabelEditHandler extends JsonOperationHandler {
    readonly operationType = ApplyLabelEditOperation.KIND;

    @inject(ErModelState)
    protected override readonly modelState: ErModelState;

    override createCommand(operation: ApplyLabelEditOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const index = this.modelState.index;
            const parentNode = index.findParentElement(operation.labelId, toTypeGuard(GNode));
            if (parentNode) {
                const modelElement = index.findElement(parentNode.id);

                if (!modelElement) {
                    throw new GLSPServerError(`Could not find model element for node with id ${parentNode.id}`);
                }

                if (DerivedAttribute.is(modelElement) && operation.labelId.endsWith('_equation_label')) {
                    modelElement.equation = operation.text;
                    return;
                }

                if ('name' in modelElement) {
                    (modelElement as ErNode).name = operation.text;
                    return;
                }

                throw new GLSPServerError(`Model element ${parentNode.id} does not support text editing.`);
            }

            const parentEdge = index.findParentElement(operation.labelId, toTypeGuard(GEdge));

            if (parentEdge) {
                const modelElement = index.findElement(parentEdge.id);

                if (WeightedEdge.is(modelElement)) {
                    modelElement.description = operation.text;
                } else {
                    throw new GLSPServerError(`Could not find editable model element for edge with id ${parentEdge.id}`);
                }
            }
        });
    }
}
