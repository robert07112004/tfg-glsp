import { Command, CreateEdgeOperation, DefaultTypes, JsonCreateEdgeOperationHandler, MaybePromise } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { WeightedEdge } from '../model/tasklist-model';
import { TaskListModelState } from '../model/tasklist-model-state';

@injectable()
export class CreateWeightedEdgeHandler extends JsonCreateEdgeOperationHandler {
    readonly elementTypeIds = ['weighted-edge'];

    @inject(TaskListModelState)
    protected override modelState: TaskListModelState;

    override createCommand(operation: CreateEdgeOperation): MaybePromise<Command | undefined> {
        return this.commandOf(() => {
            const sourceNode = this.modelState.index.get(operation.sourceElementId);
            const targetNode = this.modelState.index.get(operation.targetElementId);

            const sourceType = sourceNode?.type;
            const targetType = targetNode?.type;

            if (
                (sourceType === DefaultTypes.NODE_RECTANGLE && targetType === DefaultTypes.NODE_RECTANGLE) ||   // entity - entity
                (sourceType === DefaultTypes.NODE_DIAMOND && targetType === DefaultTypes.NODE_DIAMOND) ||       // relation - relation
                (sourceType === 'node:attribute' && targetType === 'node:attribute') ||                         // attribute - attribute  
                (sourceType === 'node:multiValuedAttribute' && targetType === 'node:multiValuedAttribute') ||   // multiValuedAttribute - multiValuedAttribute
                (sourceType === DefaultTypes.NODE_RECTANGLE && targetType === 'node:attribute') ||              // entity - attribute
                (sourceType === 'node:attribute' && targetType === DefaultTypes.NODE_RECTANGLE) ||              // attribute - entity
                (sourceType === DefaultTypes.NODE_RECTANGLE && targetType === 'node:multiValuedAttribute') ||   // entity - multiValuedAttribute
                (sourceType === 'node:multiValuedAttribute' && targetType === DefaultTypes.NODE_RECTANGLE) ||   // multiValuedAttribute - entity
                (sourceType === 'node:attribute' && targetType === 'node:multiValuedAttribute') ||              // attribute - multiValuedAttribute
                (sourceType === 'node:multiValuedAttribute' && targetType === 'node:attribute') ||              // multiValuedAttribute - attribute 
                (sourceType === 'node:derivedAttribute' && targetType === DefaultTypes.NODE_RECTANGLE) ||       // derivedAttribute - entity
                (sourceType === DefaultTypes.NODE_RECTANGLE && targetType === 'node:derivedAttribute') ||       // entity - derivedAttribute
                (sourceType === 'node:keyAttribute' && targetType === DefaultTypes.NODE_RECTANGLE) ||           // keyAttribute - entity    
                (sourceType === DefaultTypes.NODE_RECTANGLE && targetType === 'node:keyAttribute')              // entity - keyAttribute

            ) {
                return undefined;
            }

            const weightedEdge: WeightedEdge = {
                id: uuid.v4(),
                sourceId: operation.sourceElementId,
                targetId: operation.targetElementId,
                description: 'New Weighted Edge'
            };
            this.modelState.sourceModel.weightedEdges.push(weightedEdge);
        });
    }


    get label(): string {
        return 'Weighted Edge';
    }
}
