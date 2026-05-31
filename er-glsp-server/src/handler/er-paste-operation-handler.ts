import { Command, JsonOperationHandler, MaybePromise, PasteOperation, Point } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import {
    AlternativeKeyAttribute,
    Attribute,
    DerivedAttribute,
    Entity,
    ErModel,
    ErNode,
    ExistenceDependentRelation,
    IdentifyingDependentRelation,
    KeyAttribute,
    MultiValuedAttribute,
    PartialExclusiveSpecialization,
    PartialOverlappedSpecialization,
    Relation,
    TotalExclusiveSpecialization,
    TotalOverlappedSpecialization,
    WeakEntity
} from '../model/er-model';
import { ErModelIndex } from '../model/er-model-index';
import { ErModelState } from '../model/er-model-state';

const PASTE_OFFSET = 20;

@injectable()
export class ErPasteOperationHandler extends JsonOperationHandler {
    readonly operationType = PasteOperation.KIND;

    @inject(ErModelState)
    protected override modelState: ErModelState;

    protected get index(): ErModelIndex {
        return this.modelState.index as ErModelIndex;
    }

    override createCommand(operation: PasteOperation): MaybePromise<Command | undefined> {
        const jsonString = (operation.clipboardData as any)?.['application/json'];
        if (!jsonString) return undefined;

        let schemas: any[];
        try {
            schemas = JSON.parse(jsonString);
        } catch {
            return undefined;
        }

        const erNodes = schemas
            .filter(s => !this.isEdgeType(s.type))
            .map(s => this.index.findElement(s.id))
            .filter((el): el is ErNode => el !== undefined && 'position' in (el as object) && 'name' in (el as object));

        if (erNodes.length === 0) return undefined;

        return this.commandOf(() => {
            const offset = this.computeOffset(erNodes, (operation.editorContext as any)?.lastMousePosition);
            const erModel = this.modelState.sourceModel;
            erNodes.forEach(node => this.cloneToModel(erModel, node, offset));
        });
    }

    protected isEdgeType(type: string): boolean {
        return type === 'edge' || type === 'edge:weighted' || type === 'edge:optional';
    }

    protected computeOffset(nodes: ErNode[], lastMousePosition?: Point): Point {
        if (!lastMousePosition) {
            return { x: PASTE_OFFSET, y: PASTE_OFFSET };
        }
        const ref = nodes.reduce((top, n) => n.position.y < top.position.y ? n : top);
        return {
            x: lastMousePosition.x - ref.position.x,
            y: lastMousePosition.y - ref.position.y
        };
    }

    protected cloneToModel(erModel: ErModel, node: ErNode, offset: Point): void {
        const clone: any = {
            ...node,
            id: uuid.v4(),
            position: {
                x: node.position.x + offset.x,
                y: node.position.y + offset.y
            }
        };

        if (Entity.is(node)) { erModel.entities.push(clone); }
        else if (WeakEntity.is(node)) { erModel.weakEntities.push(clone); }
        else if (Relation.is(node)) { erModel.relations.push(clone); }
        else if (ExistenceDependentRelation.is(node)) { erModel.existenceDependentRelations.push(clone); }
        else if (IdentifyingDependentRelation.is(node)) { erModel.identifyingDependentRelations.push(clone); }
        else if (PartialExclusiveSpecialization.is(node)) { erModel.partialExclusiveSpecializations.push(clone); }
        else if (TotalExclusiveSpecialization.is(node)) { erModel.totalExclusiveSpecializations.push(clone); }
        else if (PartialOverlappedSpecialization.is(node)) { erModel.partialOverlappedSpecializations.push(clone); }
        else if (TotalOverlappedSpecialization.is(node)) { erModel.totalOverlappedSpecializations.push(clone); }
        else if (KeyAttribute.is(node)) { erModel.keyAttributes.push(clone); }
        else if (AlternativeKeyAttribute.is(node)) { erModel.alternativeKeyAttributes.push(clone); }
        else if (DerivedAttribute.is(node)) { erModel.derivedAttributes.push(clone); }
        else if (MultiValuedAttribute.is(node)) { erModel.multiValuedAttributes.push(clone); }
        else if (Attribute.is(node)) { erModel.attributes.push(clone); }
    }
}
