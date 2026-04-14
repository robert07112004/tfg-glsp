import {
    Command,
    CreateNodeOperation,
    DefaultTypes,
    JsonCreateNodeOperationHandler,
    MaybePromise,
    Point
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { Relation } from '../../../model/er-model';
import { ErModelState } from '../../../model/er-model-state';

@injectable()
export class CreateRelationHandler extends JsonCreateNodeOperationHandler {
    readonly elementTypeIds = [DefaultTypes.NODE_DIAMOND];

    @inject(ErModelState)
    protected override modelState: ErModelState;

    override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const relativeLocation = this.getRelativeLocation(operation) ?? Point.ORIGIN;
            const relation = this.createRelation(relativeLocation);
            const taskList = this.modelState.sourceModel;
            taskList.relations.push(relation);
        });
    }

    protected createRelation(position: Point): Relation {
        const relationCounter = this.modelState.sourceModel.relations.length;
        return {
            id: uuid.v4(),
            type: 'relation',
            name: `NewRelationNode${relationCounter + 1}`,
            cardinality: '-',
            position
        };
    }

    get label(): string {
        return 'Relation';
    }

}