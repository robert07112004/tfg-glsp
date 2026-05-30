import { AbstractJsonModelStorage, MaybePromise, RequestModelAction, SaveModelAction } from '@eclipse-glsp/server/node';
import { inject, injectable } from 'inversify';
import * as uuid from 'uuid';
import { ErModel } from './er-model';
import { ErModelState } from './er-model-state';

@injectable()
export class ErStorage extends AbstractJsonModelStorage {
    @inject(ErModelState)
    protected override modelState: ErModelState;

    loadSourceModel(action: RequestModelAction): MaybePromise<void> {
        const sourceUri = this.getSourceUri(action);
        this.modelState.uri = sourceUri;
        this.modelState.updateSourceModel(this.loadFromFile(sourceUri, ErModel.is));
    }

    saveSourceModel(action: SaveModelAction): MaybePromise<void> {
        this.writeFile(this.getFileUri(action), this.modelState.sourceModel);
    }

    protected override createModelForEmptyFile(_path: string): ErModel {
        return {
            id: uuid.v4(),
            entities: [],
            weakEntities: [],
            relations: [],
            existenceDependentRelations: [],
            identifyingDependentRelations: [],
            partialExclusiveSpecializations: [],
            totalExclusiveSpecializations: [],
            partialOverlappedSpecializations: [],
            totalOverlappedSpecializations: [],
            attributes: [],
            multiValuedAttributes: [],
            derivedAttributes: [],
            keyAttributes: [],
            alternativeKeyAttributes: [],
            transitions: [],
            weightedEdges: [],
            optionalAttributeEdges: []
        };
    }
}
