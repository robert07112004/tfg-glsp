import { Action, ActionHandler, MessageAction, SOURCE_URI_ARG } from '@eclipse-glsp/server';
import * as fs from 'fs';
import { inject, injectable } from 'inversify';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ErModelState } from '../../model/er-model-state';
import { SQLGenerator } from '../generator/sql-generator';

export interface GenerateSqlAction extends Action {
    kind: typeof GenerateSqlAction.KIND;
}

export namespace GenerateSqlAction {
    export const KIND = 'generateSql';
    export function create(): GenerateSqlAction {
        return { kind: KIND };
    }
}

@injectable()
export class GenerateSqlActionHandler implements ActionHandler {
    readonly actionKinds = [GenerateSqlAction.KIND];

    @inject(SQLGenerator) protected sqlGenerator: SQLGenerator;
    @inject(ErModelState) protected modelState: ErModelState;

    execute(action: GenerateSqlAction): Action[] {
        const modelUri = this.modelState.get(SOURCE_URI_ARG) as string | undefined;
        if (!modelUri) {
            return [MessageAction.create('No se pudo determinar la ruta del modelo.', { severity: 'ERROR' })];
        }
        const sql = this.sqlGenerator.generate();

        /*const modelUri = this.modelState.uri;
        if (!modelUri) {
            return [MessageAction.create('No se pudo determinar la ruta del modelo.', { severity: 'ERROR' })];
        }

        const sql = this.sqlGenerator.generate();
*/
        try {
            const modelPath = modelUri.startsWith('file://') ? fileURLToPath(modelUri) : modelUri;
            const modelDir = path.dirname(modelPath);
            const baseName = path.basename(modelPath, path.extname(modelPath));
            const filePath = path.join(modelDir, `${baseName}.sql`);
            fs.writeFileSync(filePath, sql, 'utf-8');
            return [MessageAction.create(
                `SQL generado correctamente en: ${path.basename(filePath)}`,
                { severity: 'INFO' }
            )];
        } catch (err) {
            return [MessageAction.create(`Error al guardar el archivo SQL: ${err}`, { severity: 'ERROR' })];
        }
    }
}
