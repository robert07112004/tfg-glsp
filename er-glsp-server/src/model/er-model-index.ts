/********************************************************************************
 * Copyright (c) 2022 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied:
 * -- GNU General Public License, version 2 with the GNU Classpath Exception
 * which is available at https://www.gnu.org/software/classpath/license.html
 * -- MIT License which is available at https://opensource.org/license/mit.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0 OR MIT
 ********************************************************************************/
import { GModelIndex } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { AlternativeKeyAttribute, Attribute, DerivedAttribute, DisjointnessEdge, Entity, ErModel, ExclusionEdge, ExistenceDependentRelation, IdentifyingDependentRelation, InclusionEdge, KeyAttribute, MultiValuedAttribute, OptionalAttributeEdge, OverlappingEdge, PartialExclusiveSpecialization, PartialOverlappedSpecialization, Relation, TotalExclusiveSpecialization, TotalOverlappedSpecialization, Transition, WeakEntity, WeightedEdge } from './er-model';

@injectable()
export class ErModelIndex extends GModelIndex {
    protected idToErModelElements = new Map<string, Entity | WeakEntity | Relation | ExistenceDependentRelation | IdentifyingDependentRelation | PartialExclusiveSpecialization |
        TotalExclusiveSpecialization | PartialOverlappedSpecialization | TotalOverlappedSpecialization | Attribute |
        MultiValuedAttribute | DerivedAttribute | KeyAttribute | AlternativeKeyAttribute | Transition | WeightedEdge |
        OptionalAttributeEdge | ExclusionEdge | InclusionEdge | DisjointnessEdge | OverlappingEdge>();

    indexErModel(ermodel: ErModel): void {
        this.idToErModelElements.clear();
        for (const element of [
            ...ermodel.entities,
            ...ermodel.weakEntities,
            ...ermodel.relations,
            ...ermodel.existenceDependentRelations,
            ...ermodel.identifyingDependentRelations,
            ...ermodel.partialExclusiveSpecializations,
            ...ermodel.totalExclusiveSpecializations,
            ...ermodel.partialOverlappedSpecializations,
            ...ermodel.totalOverlappedSpecializations,
            ...ermodel.attributes,
            ...ermodel.multiValuedAttributes,
            ...ermodel.derivedAttributes,
            ...ermodel.keyAttributes,
            ...ermodel.alternativeKeyAttributes,
            ...ermodel.transitions,
            ...ermodel.weightedEdges,
            ...ermodel.optionalAttributeEdges,
            ...(ermodel.exclusionEdges || []),
            ...(ermodel.inclusionEdges || []),
            ...(ermodel.disjointnessEdges || []),
            ...(ermodel.overlappingEdges || [])
        ]) {
            this.idToErModelElements.set(element.id, element);
        }
    }

    findEntity(id: string): Entity | undefined {
        const element = this.findElement(id);
        return Entity.is(element) ? element : undefined;
    }

    findWeakEntity(id: string): WeakEntity | undefined {
        const element = this.findElement(id);
        return WeakEntity.is(element) ? element : undefined
    }

    findRelation(id: string): Relation | undefined {
        const element = this.findElement(id);
        return Relation.is(element) ? element : undefined;
    }

    findExistenceDependentRelation(id: string): ExistenceDependentRelation | undefined {
        const element = this.findElement(id);
        return ExistenceDependentRelation.is(element) ? element : undefined
    }

    findIdentifyingDependentRelation(id: string): IdentifyingDependentRelation | undefined {
        const element = this.findElement(id);
        return IdentifyingDependentRelation.is(element) ? element : undefined
    }

    findPartialExlcusiveSpecialization(id: string): PartialExclusiveSpecialization | undefined {
        const element = this.findElement(id);
        return PartialExclusiveSpecialization.is(element) ? element : undefined
    }

    findTotalExclusiveSpecialization(id: string): TotalExclusiveSpecialization | undefined {
        const element = this.findElement(id);
        return TotalExclusiveSpecialization.is(element) ? element : undefined
    }

    findPartialOverlappedSpecialization(id: string): PartialOverlappedSpecialization | undefined {
        const element = this.findElement(id);
        return PartialOverlappedSpecialization.is(element) ? element : undefined
    }

    findTotalOverlappedSpecialization(id: string): TotalOverlappedSpecialization | undefined {
        const element = this.findElement(id);
        return TotalOverlappedSpecialization.is(element) ? element : undefined
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
        return OptionalAttributeEdge.is(element) ? element : undefined
    }

    findExclusionEdge(id: string): ExclusionEdge | undefined {
        const element = this.findElement(id);
        return ExclusionEdge.is(element) ? element : undefined
    }

    findInclusionEdge(id: string): InclusionEdge | undefined {
        const element = this.findElement(id);
        return InclusionEdge.is(element) ? element : undefined
    }

    findDisjointnessEdge(id: string): DisjointnessEdge | undefined {
        const element = this.findElement(id);
        return DisjointnessEdge.is(element) ? element : undefined
    }

    findOverlappingEdge(id: string): OverlappingEdge | undefined {
        const element = this.findElement(id);
        return OverlappingEdge.is(element) ? element : undefined
    }

    findElement(id: string): Entity | WeakEntity | Relation | ExistenceDependentRelation | IdentifyingDependentRelation | PartialExclusiveSpecialization |
        TotalExclusiveSpecialization | PartialOverlappedSpecialization | TotalOverlappedSpecialization | Attribute | MultiValuedAttribute |
        DerivedAttribute | KeyAttribute | AlternativeKeyAttribute | Transition | WeightedEdge | OptionalAttributeEdge | ExclusionEdge |
        InclusionEdge | DisjointnessEdge | OverlappingEdge | undefined {
        return this.idToErModelElements.get(id);
    }

}