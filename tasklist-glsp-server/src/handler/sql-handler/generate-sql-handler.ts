import { Action, ActionHandler } from '@eclipse-glsp/server'; // 1. Corregido ICommand por Command
import { inject, injectable } from 'inversify';
import { TaskListModelState } from '../../model/tasklist-model-state';
import { SQLGenerator } from '../generator/sql-generator'; // 2. Corregida ruta (../) y nombre (SqlGenerator)
import { TaskListModelValidator } from '../validation/diagram-validator';

// 1. Definición de la Acción
export interface GenerateSqlAction extends Action {
    kind: typeof GenerateSqlAction.KIND;
}
export namespace GenerateSqlAction {
    export const KIND = 'generateSql';
    export function create(): GenerateSqlAction {
        return { kind: KIND };
    }
}

// 2. El Manejador
@injectable()
export class GenerateSqlActionHandler implements ActionHandler {
    // 3. Corregido actionKinds: debe ser un array con los tipos de acción que maneja
    readonly actionKinds = [GenerateSqlAction.KIND];

    @inject(SQLGenerator) protected sqlGenerator: SQLGenerator; // Asegúrate de que coincida con el nombre de la clase exportada
    @inject(TaskListModelValidator) protected validator: TaskListModelValidator;
    @inject(TaskListModelState) protected modelState: TaskListModelState;

    execute(action: GenerateSqlAction): Action[] { // 4. Corregido tipo de retorno
        const root = this.modelState.root;
        
        // A. Validar
        const markers = this.validator.doBatchValidation(root);
        const errors = markers.filter(m => m.kind === 'error');

        if (errors.length > 0) {
            console.error("❌ No se puede generar SQL. Hay errores en el modelo:");
            errors.forEach(e => console.error(` - ${e.description}`));
            return[];
        }

        // B. Generar SQL
        console.log("✅ Validación correcta. Generando SQL...");
        // Nota: Asegúrate de que el método generate en SqlGenerator acepte (root, index)
        // Si en el paso 1 definiste generate(root: GModelElement, index: GModelIndex), esto funcionará.
        const sql = this.sqlGenerator.generate(root, this.modelState.index);

        // C. Imprimir resultado
        console.log("---------------- SQL GENERADO ----------------");
        console.log(sql);
        console.log("----------------------------------------------");

        return[];
    }
}