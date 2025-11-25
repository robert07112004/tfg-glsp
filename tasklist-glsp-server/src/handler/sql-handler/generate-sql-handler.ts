import { Action, ActionHandler } from '@eclipse-glsp/server';
import * as fs from 'fs';
import { inject, injectable } from 'inversify';
import * as path from 'path';
import { TaskListModelState } from '../../model/tasklist-model-state';
import { SQLGenerator } from '../generator/sql-generator';
import { TaskListModelValidator } from '../validation/diagram-validator';

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
    @inject(TaskListModelValidator) protected validator: TaskListModelValidator;
    @inject(TaskListModelState) protected modelState: TaskListModelState;

    execute(action: GenerateSqlAction): Action[] {
        const root = this.modelState.root;
        const markers = this.validator.doBatchValidation(root);
        const errors = markers.filter(m => m.kind === 'error');

        if (errors.length > 0) {
            console.error("No se puede generar SQL. Hay errores en el modelo:");
            errors.forEach(e => console.error(` - ${e.description}`));
            return[];
        }

        console.log("Validación correcta. Generando SQL...");
        const sql = this.sqlGenerator.generate(root, this.modelState.index);

        try {
            const fileName = 'script_generado.sql';
            const projectRoot = path.resolve(__dirname, '../../../');
            const filePath = path.join(projectRoot, fileName);
            fs.writeFileSync(filePath, sql, 'utf-8');
            console.log("----------------------------------------------");
            console.log(`✅ Archivo SQL generado en la raíz del proyecto:`);
            console.log(filePath);
            console.log("----------------------------------------------");
        } catch (err) {
            console.error("❌ Error al guardar el archivo:", err);
        }

        return[];
    }
}