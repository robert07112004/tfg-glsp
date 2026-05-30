import { DefaultModelState, JsonModelState } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ErModel } from './er-model';
import { ErModelIndex } from './er-model-index';

@injectable()
export class ErModelState extends DefaultModelState implements JsonModelState<ErModel> {
    @inject(ErModelIndex)
    override readonly index: ErModelIndex;

    protected _ermodel: ErModel;
    protected _uri: string;

    get uri(): string { return this._uri; }
    set uri(value: string) { this._uri = value; }

    get sourceModel(): ErModel {
        return this._ermodel;
    }

    updateSourceModel(ermodel: ErModel): void {
        this._ermodel = ermodel;
        this.index.indexErModel(ermodel);
    }

}
