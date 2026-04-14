import { Action, ActionHandler } from '@eclipse-glsp/server';
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
            console.error("No se puede generar SQL. Hay errores en el modelo:");
            errors.forEach(e => console.error(` - ${e.description}`));
            return [];
        }

        const modelUri = this.modelState.uri;
        if (!modelUri) {
            console.error("No se pudo determinar la ruta del modelo.");
            return [];
        }

        console.log("Validación correcta. Generando SQL...");
        const sql = this.sqlGenerator.generate(root);

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
            console.log(`SQL generado en: ${filePath}`);
        } catch (err) {
            console.error("Error al guardar el archivo:", err);
        }

        return [];
    }
}