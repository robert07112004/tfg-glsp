import { inject, injectable } from 'inversify';
import { ErModelState } from '../../model/er-model-state';
import { EntityTransformer } from './sql-entity-transformer';
import { GeneratedTable } from './sql-interfaces';
import { RelationTransformer } from './sql-relation-transformer';
import { SpecializationTransformer } from './sql-specialization-transformer';

@injectable()
export class SQLGenerator {

    @inject(ErModelState)
    protected modelState: ErModelState;

    public generate(): string {
        const erModel = this.modelState.sourceModel;
        const allTables: GeneratedTable[] = [];

        // Obtains all the info of all the specialization nodes of the er model
        const { byFather, byChild } = SpecializationTransformer.preCompute(erModel);

        // Obtains all the info of all the entites of the er model
        for (const entity of [...(erModel.entities || []), ...(erModel.weakEntities || [])]) {
            allTables.push(EntityTransformer.generateEntityTable(entity, erModel, byFather, byChild));
        }

        // Obtains all the info of normal, reflexive and ternary relations of the er model
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

        // Sort by dependencies and generate the SQL code
        const header = "-- Fecha: " + new Date().toLocaleString() + "\n\n";
        return header + this.sortTables(allTables);
    }

    // Sorts the tables using a topological algorithm (includes cycle detection to prevent infinite loops)
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

            if (remaining.length === before && remaining.length > 0) {
                const forced = remaining.shift()!;
                sorted.push(forced.sql);
                emitted.add(forced.name);
            }
        }

        return sorted.join("");
    }
}
