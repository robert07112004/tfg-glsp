import { Entity, ErModel } from "../../model/er-model";
import { AttributeTransformer } from "./sql-attribute-transformer";
import { SQLUtils } from "./sql-utils";

export class EntityTransformer {

    public static generateEntityTable(entity: Entity, erModel: ErModel): string {
        const tableName = SQLUtils.parseNameAndType(entity.name).name;

        // 1. Obtener atributos propios de la entidad
        const pks = AttributeTransformer.getPks(entity, erModel);
        const altKeys = AttributeTransformer.getAlternativeKeys(entity, erModel);
        const simples = AttributeTransformer.getSimpleAttributes(entity, erModel);
        const optionals = AttributeTransformer.getOptionalAttributes(entity, erModel);
        const multiValued = AttributeTransformer.getMultiValuedAttributes(entity, erModel);

        const { columns: pkCols, primaryKeyConstraint } = AttributeTransformer.processPKs(pks);
        const { columns: akCols, uniqueConstraints } = AttributeTransformer.processAlternativeKeys(altKeys, erModel);
        const attrCols = AttributeTransformer.processAttributes([...simples, ...optionals], erModel);

        const columns = [...pkCols, ...akCols, ...attrCols];
        const extraConstraints = [...uniqueConstraints];
        const foreignKeys: string[] = [];
        const extraTables = AttributeTransformer.processMultiValuedAttributes(multiValued, entity, erModel);

        // 2. Procesar Relaciones 1:N (Absorción de Claves Foráneas y Atributos)
        const oneToManyData = this.processOneToManyRelations(entity, erModel);
        columns.push(...oneToManyData.columns);
        foreignKeys.push(...oneToManyData.foreignKeys);
        extraConstraints.push(...oneToManyData.uniqueConstraints);
        extraTables.push(...oneToManyData.extraTables);

        // 3. Ensamblar la sentencia SQL de la Entidad Principal
        let sql = `CREATE TABLE ${tableName} (\n`;
        const allDefinitions = [
            ...columns,
            primaryKeyConstraint,
            ...extraConstraints,
            ...foreignKeys
        ];

        sql += allDefinitions.join(',\n');
        sql += `\n);\n\n`;

        // 4. Ensamblar las tablas extra (Atributos Multivaluados propios o de la relación absorbida)
        if (extraTables.length > 0) {
            sql += extraTables.join('\n') + '\n';
        }

        return sql;
    }

    private static processOneToManyRelations(entity: Entity, erModel: ErModel) {
        const result = {
            columns: [] as string[],
            foreignKeys: [] as string[],
            uniqueConstraints: [] as string[],
            extraTables: [] as string[]
        };

        for (const relation of erModel.relations) {
            const connectedEdges = erModel.weightedEdges.filter(edge => edge.targetId === relation.id);
            if (connectedEdges.length !== 2) continue;

            const edge1 = connectedEdges[0];
            const edge2 = connectedEdges[1];

            const desc1 = edge1.description.toUpperCase();
            const desc2 = edge2.description.toUpperCase();

            const isEdge1Many = desc1.includes('N');
            const isEdge2Many = desc2.includes('N');

            if ((isEdge1Many && !isEdge2Many) || (!isEdge1Many && isEdge2Many)) {
                const manyEdge = isEdge1Many ? edge1 : edge2;
                const oneEdge = isEdge1Many ? edge2 : edge1;

                const manyEntityId = manyEdge.sourceId;
                const oneEntityId = oneEdge.sourceId;

                // ¿Es la entidad actual la que está en el lado "N"?
                if (manyEntityId === entity.id) {
                    const oneEntity = erModel.entities.find(e => e.id === oneEntityId);
                    if (!oneEntity) continue;

                    const oneTableName = SQLUtils.parseNameAndType(oneEntity.name).name;
                    const relationName = SQLUtils.parseNameAndType(relation.name).name;

                    const isReflexive = (manyEntityId === oneEntityId);
                    const colPrefix = isReflexive ? relationName : oneTableName;

                    const fkCols: string[] = [];
                    const refCols: string[] = [];

                    // 1. Absorber Claves de la Entidad "1"
                    for (const pkNode of AttributeTransformer.getPks(oneEntity, erModel)) {
                        const { name, type } = SQLUtils.parseNameAndType(pkNode.name);
                        const colName = `${colPrefix}_${name}`;

                        // Si la cardinalidad en el lado del "1" es "0..1", significa que la participación no es obligatoria -> NULL
                        const isOptional = oneEdge.description.includes('0');
                        const nullStr = isOptional ? 'NULL' : 'NOT NULL';

                        result.columns.push(`    ${colName} ${type} ${nullStr}`);
                        fkCols.push(colName);
                        refCols.push(name);
                    }

                    if (fkCols.length > 0) {
                        result.foreignKeys.push(`    FOREIGN KEY (${fkCols.join(', ')}) REFERENCES ${oneTableName}(${refCols.join(', ')}) ON DELETE CASCADE`);
                    }

                    // 2. Absorber Atributos del rombo (Relación)
                    const uniques = AttributeTransformer.getAlternativeKeys(relation as any, erModel);
                    if (uniques.length > 0) {
                        const { columns: akCols, uniqueConstraints } = AttributeTransformer.processAlternativeKeys(uniques, erModel);
                        result.columns.push(...akCols);
                        result.uniqueConstraints.push(...uniqueConstraints);
                    }

                    const simples = AttributeTransformer.getSimpleAttributes(relation as any, erModel);
                    const optionals = AttributeTransformer.getOptionalAttributes(relation as any, erModel);
                    if (simples.length > 0 || optionals.length > 0) {
                        result.columns.push(...AttributeTransformer.processAttributes([...simples, ...optionals], erModel));
                    }

                    // 3. Procesar Multivaluados de la relación (Se asocian a la PK de esta Entidad 'N')
                    const multiValuedAttrs = AttributeTransformer.getMultiValuedAttributes(relation as any, erModel);
                    if (multiValuedAttrs.length > 0) {
                        const mvTables = AttributeTransformer.processMultiValuedAttributes(multiValuedAttrs, entity, erModel);
                        const renamedTables = mvTables.map(t => t.replace(`CREATE TABLE ${SQLUtils.parseNameAndType(entity.name).name}_`, `CREATE TABLE ${SQLUtils.parseNameAndType(entity.name).name}_${relationName}_`));
                        result.extraTables.push(...renamedTables);
                    }
                }
            }
        }
        return result;
    }

}