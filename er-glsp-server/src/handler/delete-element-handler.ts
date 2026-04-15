import {
    Command,
    DeleteElementOperation,
    GEdge,
    GNode,
    JsonOperationHandler,
    MaybePromise,
    remove,
    toTypeGuard
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { AlternativeKeyAttribute, Attribute, DerivedAttribute, DisjointnessEdge, Entity, ErElement, ExclusionEdge, ExistenceDependentRelation, IdentifyingDependentRelation, InclusionEdge, KeyAttribute, MultiValuedAttribute, OptionalAttributeEdge, OverlappingEdge, PartialExclusiveSpecialization, PartialOverlappedSpecialization, Relation, TotalExclusiveSpecialization, TotalOverlappedSpecialization, Transition, WeakEntity, WeightedEdge } from '../model/er-model';
import { ErModelState } from '../model/er-model-state';

@injectable()
export class DeleteElementHandler extends JsonOperationHandler {
    readonly operationType = DeleteElementOperation.KIND;

    @inject(ErModelState)
    protected override modelState: ErModelState;

    override createCommand(operation: DeleteElementOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            operation.elementIds.forEach(elementId => this.delete(elementId));
        });
    }

    protected delete(elementId: string): void {
        const index = this.modelState.index;
        const gModelElement = this.getGModelElementToDelete(elementId);
        const gModelElementId = gModelElement?.id ?? elementId;
        const gEdgeIds = this.getIncomingAndOutgoingEdgeIds(gModelElement);

        [...gEdgeIds, gModelElementId]
            .map(id => index.findElement(id))
            .forEach(modelElement => this.deleteModelElement(modelElement));
    }

    private getGModelElementToDelete(elementId: string): GNode | GEdge | undefined {
        const index = this.modelState.index;
        const element = index.get(elementId);
        if (element instanceof GNode || element instanceof GEdge) {
            return element;
        }
        return index.findParentElement(elementId, toTypeGuard(GNode)) ?? index.findParentElement(elementId, toTypeGuard(GEdge));
    }

    protected getIncomingAndOutgoingEdgeIds(node: GNode | GEdge | undefined): string[] {
        return this.getIncomingAndOutgoingEdges(node).map(edge => edge.id);
    }

    protected getIncomingAndOutgoingEdges(node: GNode | GEdge | undefined): GEdge[] {
        if (node instanceof GNode) {
            return [...this.modelState.index.getIncomingEdges(node), ...this.modelState.index.getOutgoingEdges(node)];
        }
        return [];
    }

    private safeRemove<T>(array: T[] | undefined, element: T): void {
        if (array) {
            remove(array, element);
        }
    }

    private deleteModelElement(modelElement: ErElement | undefined): void {
        if (!modelElement) return;

        const sourceModel = this.modelState.sourceModel;

        if (Entity.is(modelElement)) {
            this.safeRemove(sourceModel.entities, modelElement);
        } else if (WeakEntity.is(modelElement)) {
            this.safeRemove(sourceModel.weakEntities, modelElement);
        } else if (Relation.is(modelElement)) {
            this.safeRemove(sourceModel.relations, modelElement);
        } else if (ExistenceDependentRelation.is(modelElement)) {
            this.safeRemove(sourceModel.existenceDependentRelations, modelElement);
        } else if (IdentifyingDependentRelation.is(modelElement)) {
            this.safeRemove(sourceModel.identifyingDependentRelations, modelElement);
        } else if (PartialExclusiveSpecialization.is(modelElement)) {
            this.safeRemove(sourceModel.partialExclusiveSpecializations, modelElement);
        } else if (TotalExclusiveSpecialization.is(modelElement)) {
            this.safeRemove(sourceModel.totalExclusiveSpecializations, modelElement);
        } else if (PartialOverlappedSpecialization.is(modelElement)) {
            this.safeRemove(sourceModel.partialOverlappedSpecializations, modelElement);
        } else if (TotalOverlappedSpecialization.is(modelElement)) {
            this.safeRemove(sourceModel.totalOverlappedSpecializations, modelElement);
        } else if (Attribute.is(modelElement)) {
            this.safeRemove(sourceModel.attributes, modelElement);
        } else if (MultiValuedAttribute.is(modelElement)) {
            this.safeRemove(sourceModel.multiValuedAttributes, modelElement);
        } else if (DerivedAttribute.is(modelElement)) {
            this.safeRemove(sourceModel.derivedAttributes, modelElement);
        } else if (KeyAttribute.is(modelElement)) {
            this.safeRemove(sourceModel.keyAttributes, modelElement);
        } else if (AlternativeKeyAttribute.is(modelElement)) {
            this.safeRemove(sourceModel.alternativeKeyAttributes, modelElement);
        } else if (Transition.is(modelElement)) {
            this.safeRemove(sourceModel.transitions, modelElement);
        } else if (WeightedEdge.is(modelElement)) {
            this.safeRemove(sourceModel.weightedEdges, modelElement);
        } else if (OptionalAttributeEdge.is(modelElement)) {
            this.safeRemove(sourceModel.optionalAttributeEdges, modelElement);
        } else if (ExclusionEdge.is(modelElement)) {
            this.safeRemove(sourceModel.exclusionEdges, modelElement);
        } else if (InclusionEdge.is(modelElement)) {
            this.safeRemove(sourceModel.inclusionEdges, modelElement);
        } else if (DisjointnessEdge.is(modelElement)) {
            this.safeRemove(sourceModel.disjointnessEdges, modelElement);
        } else if (OverlappingEdge.is(modelElement)) {
            this.safeRemove(sourceModel.overlappingEdges, modelElement);
        }
    }
}
