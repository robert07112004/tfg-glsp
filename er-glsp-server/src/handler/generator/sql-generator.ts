import { inject, injectable } from 'inversify';
import { ErModelState } from '../../model/er-model-state';
import { AttributeTransformer } from './sql-attribute-transformer';
import { SQLUtils } from './sql-utils';

@injectable()
export class SQLGenerator {

    @inject(ErModelState)
    protected modelState: ErModelState;

    public generate(): string {
        const erModel = this.modelState.sourceModel;
        let sql = "-- Fecha: " + new Date().toLocaleString() + "\n\n";

        for (const entity of erModel.entities) {

            const pks = AttributeTransformer.getPks(entity, erModel);
            const altKeys = AttributeTransformer.getAlternativeKeys(entity, erModel);
            const simples = AttributeTransformer.getSimpleAttributes(entity, erModel);
            const optionals = AttributeTransformer.getOptionalAttributes(entity, erModel);
            const multiValued = AttributeTransformer.getMultiValuedAttributes(entity, erModel);

            const { columns: pkCols, primaryKeyConstraint } = AttributeTransformer.processPKs(pks);
            const { columns: akCols, uniqueConstraints } = AttributeTransformer.processAlternativeKeys(altKeys, erModel);
            const attrCols = AttributeTransformer.processAttributes([...simples, ...optionals], erModel);
            const mvTablesSql = AttributeTransformer.processMultiValuedAttributes(multiValued, entity, erModel);

            const tableName = SQLUtils.parseNameAndType(entity.name).name;
            const mainTableLines = [
                ...pkCols,
                ...akCols,
                ...attrCols
            ];

            if (primaryKeyConstraint) mainTableLines.push(primaryKeyConstraint);
            if (uniqueConstraints.length > 0) mainTableLines.push(...uniqueConstraints);

            sql += `CREATE TABLE ${tableName} (\n`;
            sql += mainTableLines.join(',\n');
            sql += `\n);\n\n`;

            if (mvTablesSql.length > 0) sql += mvTablesSql.join('\n') + '\n';

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
