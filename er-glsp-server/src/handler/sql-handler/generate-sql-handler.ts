import { Action, ActionHandler, MessageAction } from '@eclipse-glsp/server';
import * as fs from 'fs';
import { inject, injectable } from 'inversify';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ErModelState } from '../../model/er-model-state';
import { SQLGenerator } from '../generator/sql-generator';
import { ErModelValidator } from '../validation/diagram-validator';

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
    @inject(ErModelValidator) protected validator: ErModelValidator;
    @inject(ErModelState) protected modelState: ErModelState;

    execute(action: GenerateSqlAction): Action[] {
        const root = this.modelState.root;
        const markers = this.validator.doBatchValidation(root);
        const errors = markers.filter(m => m.kind === 'error');

        if (errors.length > 0) {
            return [MessageAction.create(
                `No se puede generar SQL: el modelo tiene ${errors.length} error${errors.length > 1 ? 'es' : ''} de validación. Corrígelos y valida de nuevo.`,
                { severity: 'WARNING' }
            )];
        }

        const modelUri = this.modelState.uri;
        if (!modelUri) {
            return [MessageAction.create('No se pudo determinar la ruta del modelo.', { severity: 'ERROR' })];
        }

        const sql = this.sqlGenerator.generate();

        try {
            let modelPath: string;

            if (modelUri.startsWith('file:///')) {
                modelPath = decodeURIComponent(modelUri.replace('file:///', ''));
                modelPath = modelPath.replace(/\//g, path.sep);
            } else if (modelUri.startsWith('file://')) {
                modelPath = fileURLToPath(modelUri);
            } else {
                modelPath = modelUri;
            }

            const modelDir = path.dirname(modelPath);

            let counter = 1;
            let filePath = path.join(modelDir, `script_generado${counter}.sql`);
            while (fs.existsSync(filePath)) {
                counter++;
                filePath = path.join(modelDir, `script_generado${counter}.sql`);
            }

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
