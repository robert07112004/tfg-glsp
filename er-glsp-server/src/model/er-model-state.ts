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
