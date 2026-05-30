import { inject, injectable } from 'inversify';
import { ErModelState } from '../../model/er-model-state';
import { GeneratedTable } from './sql-interfaces';
import { EntityTransformer } from './sql-entity-transformer';
import { RelationTransformer } from './sql-relation-transformer';
import { SpecializationTransformer } from './sql-specialization-transformer';

@injectable()
export class SQLGenerator {

    @inject(ErModelState)
    protected modelState: ErModelState;

    public generate(): string {
        const erModel = this.modelState.sourceModel;
        const allTables: GeneratedTable[] = [];

        // 1. Pre-computar datos de especialización una sola vez
        const { byFather, byChild } = SpecializationTransformer.preCompute(erModel);

        // 2. Tablas de entidades fuertes y débiles
        for (const entity of [...(erModel.entities || []), ...(erModel.weakEntities || [])]) {
            allTables.push(EntityTransformer.generateEntityTable(entity, erModel, byFather, byChild));
        }

        // 3. Tablas de relaciones N:M, reflexivas N:M y ternarias
        const allRels = [
            ...(erModel.relations || []),
            ...(erModel.existenceDependentRelations || []),
            ...(erModel.identifyingDependentRelations || [])
        ];
        for (const relation of allRels) {
            if (RelationTransformer.needsJunctionTable(relation, erModel)) {
                allTables.push(RelationTransformer.generateManyToManyTable(relation, erModel));
            }
        }

        // 4. Ordenar por dependencias y generar el SQL final
        const header = "-- Fecha: " + new Date().toLocaleString() + "\n\n";
        return header + this.sortTables(allTables);
    }

    /**
     * Ordena las tablas mediante un algoritmo topológico:
     * si la tabla A depende de B (FK hacia B), B se emite antes que A.
     * Incluye detección de ciclos para evitar bucles infinitos.
     */
    private sortTables(tables: GeneratedTable[]): string {
        const sorted: string[] = [];
        const emitted = new Set<string>();
        let remaining = [...tables];

        while (remaining.length > 0) {
            const before = remaining.length;

            remaining = remaining.filter(table => {
                const ready = table.dependencies.every(dep => emitted.has(dep) || dep === table.name);
                if (ready) {
                    sorted.push(table.sql);
                    emitted.add(table.name);
                    return false;
                }
                return true;
            });

            // Si no se pudo emitir ninguna tabla en esta pasada, hay dependencia circular.
            // Forzamos la emisión de la primera pendiente para evitar el bucle infinito.
            if (remaining.length === before && remaining.length > 0) {
                const forced = remaining.shift()!;
                sorted.push(forced.sql);
                emitted.add(forced.name);
            }
        }

        return sorted.join("");
    }
}
