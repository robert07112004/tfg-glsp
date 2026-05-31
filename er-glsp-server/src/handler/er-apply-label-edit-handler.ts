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
                    throw new GLSPServerError(`No se pudo encontrar el elemento del modelo para el nodo con ID ${parentNode.id}`);
                }

                if (DerivedAttribute.is(modelElement) && operation.labelId.endsWith('_equation_label')) {
                    modelElement.equation = operation.text;
                    return;
                }

                if ('name' in modelElement) {
                    (modelElement as ErNode).name = operation.text;
                    (modelElement as ErNode).size = undefined;
                    return;
                }

                throw new GLSPServerError(`El elemento del modelo ${parentNode.id} no admite la edición de texto`);
            }

            const parentEdge = index.findParentElement(operation.labelId, toTypeGuard(GEdge));

            if (parentEdge) {
                const modelElement = index.findElement(parentEdge.id);

                if (WeightedEdge.is(modelElement)) {
                    modelElement.description = operation.text;
                } else {
                    throw new GLSPServerError(`No se pudo encontrar el elemento de modelo editable para la arista ponderada con ID ${parentEdge.id}`);
                }
            }
        });
    }
}
