import { inject, injectable } from 'inversify';
import { ErModelState } from '../../model/er-model-state';
import { EntityTransformer } from './sql-entity-transformer';
import { RelationTransformer } from './sql-relation-transformer';

@injectable()
export class SQLGenerator {

    @inject(ErModelState)
    protected modelState: ErModelState;

    public generate(): string {
        const erModel = this.modelState.sourceModel;
        let sql = "-- Fecha: " + new Date().toLocaleString() + "\n\n";

        // 1. Generar Entidades (Esto ahora incluye atributos propios Y las propagaciones 1:N)
        for (const entity of erModel.entities) {
            sql += EntityTransformer.generateEntityTable(entity, erModel);
        }

        // 2. Generar Relaciones N:M (y Ternarias/N-arias puras)
        for (const relation of erModel.relations) {
            if (RelationTransformer.isManyToMany(relation, erModel)) {
                sql += RelationTransformer.generateManyToManyTable(relation, erModel);
            }
        }

        return sql;
    }

    /*private sortTables(tables: GeneratedTable[]): string {
        const sorted: string[] = [];
        const createdTableNames = new Set<string>();
        let remaining = [...tables];

        while (remaining.length > 0) {
            const initialLength = remaining.length;

            remaining = remaining.filter(table => {
                const canCreate = table.dependencies.every(dep =>
                    createdTableNames.has(dep) || dep === table.name
                );

                if (canCreate) {
                    sorted.push(table.sql);
                    createdTableNames.add(table.name);
                    return false;
                }
                return true;
            });

            // Evitar bucle infinito si hay dependencias circulares
            if (remaining.length === initialLength && remaining.length > 0) {
                const forced = remaining.shift()!;
                sorted.push(forced.sql);
                createdTableNames.add(forced.name);
            }
        }
        return sorted.join("");
    }*/

}
