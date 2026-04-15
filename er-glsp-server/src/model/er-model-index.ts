import { GModelIndex } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { AlternativeKeyAttribute, Attribute, DerivedAttribute, DisjointnessEdge, Entity, ErElement, ErModel, ExclusionEdge, ExistenceDependentRelation, IdentifyingDependentRelation, InclusionEdge, KeyAttribute, MultiValuedAttribute, OptionalAttributeEdge, OverlappingEdge, PartialExclusiveSpecialization, PartialOverlappedSpecialization, Relation, TotalExclusiveSpecialization, TotalOverlappedSpecialization, Transition, WeakEntity, WeightedEdge } from './er-model';

@injectable()
export class ErModelIndex extends GModelIndex {
    protected idToErModelElements = new Map<string, ErElement>();

    indexErModel(ermodel: ErModel): void {
        this.idToErModelElements.clear();

        const allElements: ErElement[] = [
            ...(ermodel.entities || []),
            ...(ermodel.weakEntities || []),
            ...(ermodel.relations || []),
            ...(ermodel.existenceDependentRelations || []),
            ...(ermodel.identifyingDependentRelations || []),
            ...(ermodel.partialExclusiveSpecializations || []),
            ...(ermodel.totalExclusiveSpecializations || []),
            ...(ermodel.partialOverlappedSpecializations || []),
            ...(ermodel.totalOverlappedSpecializations || []),
            ...(ermodel.attributes || []),
            ...(ermodel.multiValuedAttributes || []),
            ...(ermodel.derivedAttributes || []),
            ...(ermodel.keyAttributes || []),
            ...(ermodel.alternativeKeyAttributes || []),
            ...(ermodel.transitions || []),
            ...(ermodel.weightedEdges || []),
            ...(ermodel.optionalAttributeEdges || []),
            ...(ermodel.exclusionEdges || []),
            ...(ermodel.inclusionEdges || []),
            ...(ermodel.disjointnessEdges || []),
            ...(ermodel.overlappingEdges || [])
        ];

        for (const element of allElements) {
            if (element && element.id) {
                this.idToErModelElements.set(element.id, element);
            }
        }
    }

    findElement(id: string): ErElement | undefined {
        return this.idToErModelElements.get(id);
    }

    findEntity(id: string): Entity | undefined {
        const element = this.findElement(id);
        return Entity.is(element) ? element : undefined;
    }

    findWeakEntity(id: string): WeakEntity | undefined {
        const element = this.findElement(id);
        return WeakEntity.is(element) ? element : undefined;
    }

    findRelation(id: string): Relation | undefined {
        const element = this.findElement(id);
        return Relation.is(element) ? element : undefined;
    }

    findExistenceDependentRelation(id: string): ExistenceDependentRelation | undefined {
        const element = this.findElement(id);
        return ExistenceDependentRelation.is(element) ? element : undefined;
    }

    findIdentifyingDependentRelation(id: string): IdentifyingDependentRelation | undefined {
        const element = this.findElement(id);
        return IdentifyingDependentRelation.is(element) ? element : undefined;
    }

    findPartialExclusiveSpecialization(id: string): PartialExclusiveSpecialization | undefined {
        const element = this.findElement(id);
        return PartialExclusiveSpecialization.is(element) ? element : undefined;
    }

    findTotalExclusiveSpecialization(id: string): TotalExclusiveSpecialization | undefined {
        const element = this.findElement(id);
        return TotalExclusiveSpecialization.is(element) ? element : undefined;
    }

    findPartialOverlappedSpecialization(id: string): PartialOverlappedSpecialization | undefined {
        const element = this.findElement(id);
        return PartialOverlappedSpecialization.is(element) ? element : undefined;
    }

    findTotalOverlappedSpecialization(id: string): TotalOverlappedSpecialization | undefined {
        const element = this.findElement(id);
        return TotalOverlappedSpecialization.is(element) ? element : undefined;
    }

    findAttribute(id: string): Attribute | undefined {
        const element = this.findElement(id);
        return Attribute.is(element) ? element : undefined;
    }

    findMultiValuedAttribute(id: string): MultiValuedAttribute | undefined {
        const element = this.findElement(id);
        return MultiValuedAttribute.is(element) ? element : undefined;
    }

    findDerivedAttribute(id: string): DerivedAttribute | undefined {
        const element = this.findElement(id);
        return DerivedAttribute.is(element) ? element : undefined;
    }

    findKeyAttribute(id: string): KeyAttribute | undefined {
        const element = this.findElement(id);
        return KeyAttribute.is(element) ? element : undefined;
    }

    findAlternativeKeyAttribute(id: string): AlternativeKeyAttribute | undefined {
        const element = this.findElement(id);
        return AlternativeKeyAttribute.is(element) ? element : undefined;
    }

    findTransition(id: string): Transition | undefined {
        const element = this.findElement(id);
        return Transition.is(element) ? element : undefined;
    }

    findWeightedEdge(id: string): WeightedEdge | undefined {
        const element = this.findElement(id);
        return WeightedEdge.is(element) ? element : undefined;
    }

    findOptionalAttributeEdge(id: string): OptionalAttributeEdge | undefined {
        const element = this.findElement(id);
        return OptionalAttributeEdge.is(element) ? element : undefined;
    }

    findExclusionEdge(id: string): ExclusionEdge | undefined {
        const element = this.findElement(id);
        return ExclusionEdge.is(element) ? element : undefined;
    }

    findInclusionEdge(id: string): InclusionEdge | undefined {
        const element = this.findElement(id);
        return InclusionEdge.is(element) ? element : undefined;
    }

    findDisjointnessEdge(id: string): DisjointnessEdge | undefined {
        const element = this.findElement(id);
        return DisjointnessEdge.is(element) ? element : undefined;
    }

    findOverlappingEdge(id: string): OverlappingEdge | undefined {
        const element = this.findElement(id);
        return OverlappingEdge.is(element) ? element : undefined;
    }

}