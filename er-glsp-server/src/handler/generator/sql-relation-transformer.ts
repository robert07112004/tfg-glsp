import { Entity, ErModel, Relation } from "../../model/er-model";
import { AttributeTransformer } from "./sql-attribute-transformer";
import { SQLUtils } from "./sql-utils";

export class RelationTransformer {

    public static generateManyToManyTable(relation: Relation, erModel: ErModel): string {
        const relationName = SQLUtils.parseNameAndType(relation.name).name;
        const columns: string[] = [];
        const primaryKeys: string[] = [];
        const foreignKeys: string[] = [];
        const extraConstraints: string[] = [];

        const connectedEntities = RelationTransformer.connectedEntities(relation, erModel);

        // Obtener las PKs de las entidades conectadas para usarlas como FKs
        for (const entity of connectedEntities) {
            if (entity) {
                const entityTableName = SQLUtils.parseNameAndType(entity.name).name;
                for (const pkNode of AttributeTransformer.getPks(entity, erModel)) {
                    const { name, type } = SQLUtils.parseNameAndType(pkNode.name);
                    if (connectedEntities.length === 1) {
                        const colName1 = `${entityTableName}_${name}_1`;
                        const colName2 = `${entityTableName}_${name}_2`;
                        columns.push(`    ${colName1} ${type} NOT NULL`);
                        columns.push(`    ${colName2} ${type} NOT NULL`);
                        primaryKeys.push(colName1);
                        primaryKeys.push(colName2);
                        foreignKeys.push(`    FOREIGN KEY (${colName1}) REFERENCES ${entityTableName}(${name}) ON DELETE CASCADE`);
                        foreignKeys.push(`    FOREIGN KEY (${colName2}) REFERENCES ${entityTableName}(${name}) ON DELETE CASCADE`);
                    } else {
                        const colName = `${entityTableName}_${name}`;
                        columns.push(`    ${colName} ${type} NOT NULL`);
                        primaryKeys.push(colName);
                        foreignKeys.push(`    FOREIGN KEY (${colName}) REFERENCES ${entityTableName}(${name}) ON DELETE CASCADE`);
                    }
                }
            }
        }

        // Procesar atributos propios
        const uniques = AttributeTransformer.getAlternativeKeys(relation as any, erModel);
        if (uniques.length > 0) {
            const { columns: akCols, uniqueConstraints } = AttributeTransformer.processAlternativeKeys(uniques, erModel);
            columns.push(...akCols);
            extraConstraints.push(...uniqueConstraints);
        }

        const simples = AttributeTransformer.getSimpleAttributes(relation as any, erModel);
        const optionals = AttributeTransformer.getOptionalAttributes(relation as any, erModel);
        if (simples.length > 0 || optionals.length > 0) {
            columns.push(...AttributeTransformer.processAttributes([...simples, ...optionals], erModel));
        }

        // Ensamblar la sentencia SQL
        let sql = `CREATE TABLE ${relationName} (\n`;
        const allDefinitions = [
            ...columns,
            ...(primaryKeys.length > 0 ? [`    PRIMARY KEY (${primaryKeys.join(', ')})`] : []),
            ...extraConstraints,
            ...foreignKeys
        ];
        sql += allDefinitions.join(',\n') + `\n);\n\n`;

        // Procesar atributos multivaluados propios de la relación
        const multiValuedAttributes = AttributeTransformer.getMultiValuedAttributes(relation as any, erModel);
        for (const mvAttr of multiValuedAttributes) {
            const mvRootName = SQLUtils.parseNameAndType(mvAttr.name).name;
            const newTableName = `${relationName}_${mvRootName}`;

            const mvColumns = primaryKeys.map(pkName => columns.find(c => c.trim().startsWith(pkName))!);
            const currentAttrNames: string[] = [];
            const childrenNodes = AttributeTransformer.getChildrenNodes(mvAttr.id, erModel);

            const nodesToProcess = childrenNodes.length > 0 ? childrenNodes : [mvAttr];
            for (const node of nodesToProcess) {
                const { name, type } = SQLUtils.parseNameAndType(node.name);
                mvColumns.push(`    ${name} ${type} NOT NULL`);
                currentAttrNames.push(name);
            }

            const allPkNames = [...primaryKeys, ...currentAttrNames];
            const tableLines = [
                ...mvColumns,
                `    PRIMARY KEY (${allPkNames.join(', ')})`,
                `    FOREIGN KEY (${primaryKeys.join(', ')}) REFERENCES ${relationName}(${primaryKeys.join(', ')}) ON DELETE CASCADE`
            ];

            sql += `CREATE TABLE ${newTableName} (\n${tableLines.join(',\n')}\n);\n\n`;
        }

        return sql;
    }

    public static isManyToMany(relation: Relation, erModel: ErModel): boolean {
        const connectedEdges = erModel.weightedEdges.filter(weightedEdge =>
            weightedEdge.targetId === relation.id && weightedEdge.description.includes('N')
        );
        return connectedEdges.length >= 2 && (relation.cardinality === 'N:M' || relation.cardinality === 'N:M:P');
    }

    public static connectedEntities(relation: Relation, erModel: ErModel): Entity[] {
        const connectedEdges = erModel.weightedEdges.filter(weightedEdge => weightedEdge.targetId === relation.id);
        const entityIds = connectedEdges.map(edge => edge.sourceId);
        return erModel.entities.filter(entity => entityIds.includes(entity.id));
    }

}