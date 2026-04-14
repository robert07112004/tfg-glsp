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
        const er = this.loadFromFile(sourceUri, ErModel.is);
        this.modelState.uri = sourceUri;
        this.modelState.updateSourceModel(er);
    }

    saveSourceModel(action: SaveModelAction): MaybePromise<void> {
        const sourceUri = this.getFileUri(action);
        this.writeFile(sourceUri, this.modelState.sourceModel);
    }

    protected override createModelForEmptyFile(path: string): ErModel {
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
            optionalAttributeEdges: [],
            exclusionEdges: [],
            inclusionEdges: [],
            disjointnessEdges: [],
            overlappingEdges: []
        };
    }
}
