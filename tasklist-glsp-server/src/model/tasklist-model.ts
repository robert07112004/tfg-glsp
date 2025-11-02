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

import { AnyObject, hasArrayProp, hasObjectProp, hasStringProp } from '@eclipse-glsp/server';

/**
 * The source model for `tasklist` GLSP diagrams. A `TaskList` is a
 * plain JSON objects that contains a set of {@link Task tasks} and {@link Transition transitions}.
 */
export interface TaskList {
    id: string;
    tasks: Task[];
    weakEntities: WeakEntity[];
    relations: Relation[];
    existenceDependentRelations: ExistenceDependentRelation[];
    identifyingDependentRelations: IdentifyingDependentRelation[];
    partialExclusiveSpecializations: PartialExclusiveSpecialization[];
    totalExclusiveSpecializations: TotalExclusiveSpecialization[];
    partialOverlappedSpecializations: PartialOverlappedSpecialization[];
    totalOverlappedSpecializations: TotalOverlappedSpecialization[];
    attributes: Attribute[];
    multiValuedAttributes: MultiValuedAttribute[];
    derivedAttributes: DerivedAttribute[];
    keyAttributes: KeyAttribute[];
    transitions: Transition[];
    weightedEdges: WeightedEdge[];
    optionalAttributeEdges: OptionalAttributeEdge[];
}

export namespace TaskList {
    export function is(object: any): object is TaskList {
        return (
            AnyObject.is(object) &&
            hasStringProp(object, 'id') &&
            hasArrayProp(object, 'tasks')
        );
    }
}

export interface Task {
    id: string;
    type: 'entity';
    name: string;
    position: { x: number; y: number };
    size?: { width: number; height: number };
}

export namespace Task {
    export function is(object: any): object is Task {
        return (
            AnyObject.is(object) &&
            hasStringProp(object, 'id') &&
            hasStringProp(object, 'type') && (object as Task).type === 'entity' &&
            hasStringProp(object, 'name') &&
            hasObjectProp(object, 'position')
        );
    }
}

export interface WeakEntity {
    id: string;
    type: 'weakEntity';
    name: string;
    position: { x: number; y: number };
    size?: { width: number; height: number };
}

export namespace WeakEntity {
    export function is(object: any): object is WeakEntity {
        return (
            AnyObject.is(object) &&
            hasStringProp(object, 'id') &&
            hasStringProp(object, 'type') && (object as WeakEntity).type === 'weakEntity' &&
            hasStringProp(object, 'name') &&
            hasObjectProp(object, 'position')
        );
    }
}

export interface Relation {
    id: string;
    type: 'relation';
    name: string;
    cardinality: string;
    position: { x: number; y: number };
    size?: { width: number; height: number };
}

export namespace Relation {
    export function is(object: any): object is Relation {
        return (
            AnyObject.is(object) &&
            hasStringProp(object, 'id') &&
            hasStringProp(object, 'type') && (object as Relation).type === 'relation' &&
            hasStringProp(object, 'name') &&
            hasStringProp(object, 'cardinality') &&
            hasObjectProp(object, 'position')
        );
    }
}

export interface ExistenceDependentRelation {
    id: string;
    type: 'existenceDependentRelation';
    name: string;
    cardinality: string;
    dependencyLabel: string;
    position: { x: number; y: number };
    size?: { width: number; height: number };
}

export namespace ExistenceDependentRelation {
    export function is(object: any): object is ExistenceDependentRelation {
        return (
            AnyObject.is(object) &&
            hasStringProp(object, 'id') &&
            hasStringProp(object, 'type') && (object as ExistenceDependentRelation).type === 'existenceDependentRelation' &&
            hasStringProp(object, 'name') &&
            hasStringProp(object, 'cardinality') &&
            hasStringProp(object, 'dependencyLabel') &&
            hasObjectProp(object, 'position')
        );
    }
}

export interface IdentifyingDependentRelation {
    id: string;
    type: 'identifyingDependentRelation';
    name: string;
    cardinality: string;
    dependencyLabel: string;
    position: { x: number; y: number };
    size?: { width: number; height: number };
}

export namespace IdentifyingDependentRelation {
    export function is(object: any): object is IdentifyingDependentRelation {
        return (
            AnyObject.is(object) &&
            hasStringProp(object, 'id') &&
            hasStringProp(object, 'type') && (object as IdentifyingDependentRelation).type === 'identifyingDependentRelation' &&
            hasStringProp(object, 'name') &&
            hasStringProp(object, 'cardinality') &&
            hasStringProp(object, 'dependencyLabel') &&
            hasObjectProp(object, 'position')
        );
    }
}

export interface PartialExclusiveSpecialization {
    id: string;
    type: 'partialExclusiveSpecialization';
    name: string;
    position: { x: number; y: number };
    size?: { width: number; height: number };
}

export namespace PartialExclusiveSpecialization {
    export function is(object: any): object is PartialExclusiveSpecialization {
        return (
            AnyObject.is(object) &&
            hasStringProp(object, 'id') &&
            hasStringProp(object, 'type') && (object as PartialExclusiveSpecialization).type === 'partialExclusiveSpecialization' &&
            hasStringProp(object, 'name') &&
            hasObjectProp(object, 'position')
        );
    }
}

export interface TotalExclusiveSpecialization {
    id: string;
    type: 'totalExclusiveSpecialization';
    name: string;
    position: { x: number; y: number };
    size?: { width: number; height: number };
}

export namespace TotalExclusiveSpecialization {
    export function is(object: any): object is TotalExclusiveSpecialization {
        return (
            AnyObject.is(object) &&
            hasStringProp(object, 'id') &&
            hasStringProp(object, 'type') && (object as TotalExclusiveSpecialization).type === 'totalExclusiveSpecialization' &&
            hasStringProp(object, 'name') &&
            hasObjectProp(object, 'position')
        );
    }
}

export interface PartialOverlappedSpecialization {
    id: string;
    type: 'partialOverlappedSpecialization';
    name: string;
    position: { x: number; y: number };
    size?: { width: number; height: number };
}

export namespace PartialOverlappedSpecialization {
    export function is(object: any): object is PartialOverlappedSpecialization {
        return (
            AnyObject.is(object) &&
            hasStringProp(object, 'id') &&
            hasStringProp(object, 'type') && (object as PartialOverlappedSpecialization).type === 'partialOverlappedSpecialization' &&
            hasStringProp(object, 'name') &&
            hasObjectProp(object, 'position')
        );
    }
}

export interface TotalOverlappedSpecialization {
    id: string;
    type: 'totalOverlappedSpecialization';
    name: string;
    position: { x: number; y: number };
    size?: { width: number; height: number };
}

export namespace TotalOverlappedSpecialization {
    export function is(object: any): object is TotalOverlappedSpecialization {
        return (
            AnyObject.is(object) &&
            hasStringProp(object, 'id') &&
            hasStringProp(object, 'type') && (object as TotalOverlappedSpecialization).type === 'totalOverlappedSpecialization' &&
            hasStringProp(object, 'name') &&
            hasObjectProp(object, 'position')
        );
    }
}

export interface Attribute {
    id: string;
    type: 'attribute';
    name: string;
    position: { x: number; y: number };
    size?: { width: number; height: number };
}

export namespace Attribute {
    export function is(object: any): object is Attribute {
        return (
            AnyObject.is(object) &&
            hasStringProp(object, 'id') &&
            hasStringProp(object, 'type') && (object as Attribute).type === 'attribute' &&
            hasStringProp(object, 'name') &&
            hasObjectProp(object, 'position')
        );
    }
}

export interface MultiValuedAttribute {
    id: string;
    type: 'multiValuedAttribute';
    name: string;
    position: { x: number; y: number };
    size?: { width: number; height: number };
}

export namespace MultiValuedAttribute {
    export function is(object: any): object is MultiValuedAttribute {
        return (
            AnyObject.is(object) &&
            hasStringProp(object, 'id') &&
            hasStringProp(object, 'type') && (object as MultiValuedAttribute).type === 'multiValuedAttribute' &&
            hasStringProp(object, 'name') &&
            hasObjectProp(object, 'position')
        );
    }
}

export interface DerivedAttribute {
    id: string;
    type: 'derivedAttribute';
    name: string;
    position: { x: number; y: number };
    size?: { width: number; height: number };
}

export namespace DerivedAttribute {
    export function is(object: any): object is DerivedAttribute {
        return (
            AnyObject.is(object) &&
            hasStringProp(object, 'id') &&
            hasStringProp(object, 'type') && (object as DerivedAttribute).type === 'derivedAttribute' &&
            hasStringProp(object, 'name') &&
            hasObjectProp(object, 'position')
        );
    }
}

export interface KeyAttribute {
    id: string;
    type: 'keyAttribute';
    name: string;
    position: { x: number; y: number };
    size?: { width: number; height: number };
}

export namespace KeyAttribute {
    export function is(object: any): object is KeyAttribute {
        return (
            AnyObject.is(object) &&
            hasStringProp(object, 'id') &&
            hasStringProp(object, 'type') && (object as KeyAttribute).type === 'keyAttribute' &&
            hasStringProp(object, 'name') &&
            hasObjectProp(object, 'position')
        );
    }
}

export interface Transition {
    id: string;
    sourceTaskId: string;
    targetTaskId: string;
}

export namespace Transition {
    export function is(object: any): object is Transition {
        return (
            AnyObject.is(object) &&
            hasStringProp(object, 'id') &&
            hasStringProp(object, 'sourceTaskId') &&
            hasStringProp(object, 'targetTaskId')
        );
    }
}

export interface WeightedEdge {
    id: string;
    type: 'edge:weighted';
    description: string;
    sourceId: string;
    targetId: string;
}

export namespace WeightedEdge {
    export function is(object: any): object is WeightedEdge {
        return (
            AnyObject.is(object) &&
            hasStringProp(object, 'id') &&
            hasStringProp(object, 'type') && (object as WeightedEdge).type === 'edge:weighted' &&
            hasStringProp(object, 'description') &&
            hasStringProp(object, 'sourceId') &&
            hasStringProp(object, 'targetId')
        );
    }
}

export interface OptionalAttributeEdge {
    id: string;
    type: 'edge:optional';
    sourceId: string;
    targetId: string;
}

export namespace OptionalAttributeEdge {
    export function is(object: any): object is OptionalAttributeEdge {
        return (
            AnyObject.is(object) &&
            hasStringProp(object, 'id') &&
            hasStringProp(object, 'type') && (object as OptionalAttributeEdge).type === 'edge:optional' &&
            hasStringProp(object, 'sourceId') &&
            hasStringProp(object, 'targetId')
        );
    }
}
