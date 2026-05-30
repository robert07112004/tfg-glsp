import { BaseRelation, Entity, ErModel, WeakEntity } from "../../model/er-model";
import { AttributeTransformer } from "./sql-attribute-transformer";
import { EntityTransformer } from "./sql-entity-transformer";
import { GeneratedTable } from "./sql-interfaces";
import { SQLUtils } from "./sql-utils";

export class RelationTransformer {

    /**
     * Genera la tabla intermedia para una relación N:M binaria, N:M reflexiva o ternaria.
     * Rastrea las dependencias hacia las entidades participantes.
     */
    public static generateManyToManyTable(relation: BaseRelation, erModel: ErModel): GeneratedTable {
        const relationName = SQLUtils.parseNameAndType(relation.name).name;
        const columns: string[] = [];
        const primaryKeys: string[] = [];
        const foreignKeys: string[] = [];
        const extraConstraints: string[] = [];
        const dependencies: string[] = [];

        const connectedEdges = (erModel.weightedEdges || []).filter(e => e.targetId === relation.id);
        const isTernary = connectedEdges.length >= 3;

        // Contador de apariciones por nombre de tabla (para detectar reflexivas)
        const nameFrequencies = new Map<string, number>();
        for (const edge of connectedEdges) {
            const entity = this.findEntityByEdge(edge.sourceId, erModel);
            if (!entity) continue;
            const tableName = SQLUtils.parseNameAndType(entity.name).name;
            nameFrequencies.set(tableName, (nameFrequencies.get(tableName) || 0) + 1);
        }

        const entityCounts = new Map<string, number>();
        const allEntities = [...(erModel.entities || []), ...(erModel.weakEntities || [])];

        for (const edge of connectedEdges) {
            const entity = allEntities.find(e => e.id === edge.sourceId);
            if (!entity) continue;

            const entityTableName = SQLUtils.parseNameAndType(entity.name).name;
            dependencies.push(entityTableName);

            const isRepeated = (nameFrequencies.get(entityTableName) || 0) > 1;
            const currentIndex = (entityCounts.get(entityTableName) || 0) + 1;
            entityCounts.set(entityTableName, currentIndex);
            const suffix = isRepeated ? `_${currentIndex}` : '';

            const entityPks = EntityTransformer.getEntityFullPKs(entity, erModel);
            const currentFkCols: string[] = [];
            const currentRefCols: string[] = [];

            for (const pk of entityPks) {
                const colName = `${entityTableName}_${pk.colNameInThisTable}${suffix}`;
                columns.push(`    ${colName} ${pk.type} NOT NULL`);
                currentFkCols.push(colName);
                currentRefCols.push(pk.colNameInThisTable);

                if (this.goesIntoPK(edge, relation, isTernary, primaryKeys, connectedEdges)) {
                    primaryKeys.push(colName);
                }
            }

            if (currentFkCols.length > 0) {
                foreignKeys.push(`    FOREIGN KEY (${currentFkCols.join(', ')}) REFERENCES ${entityTableName}(${currentRefCols.join(', ')}) ON DELETE CASCADE`);
            }
        }

        // Claves alternativas y atributos propios del rombo
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

        // Ensamblado de la tabla principal
        let sql = `CREATE TABLE ${relationName} (\n`;
        const allDefs = [
            ...columns,
            ...(primaryKeys.length > 0 ? [`    PRIMARY KEY (${primaryKeys.join(', ')})`] : []),
            ...extraConstraints,
            ...foreignKeys
        ];
        sql += allDefs.join(',\n') + `\n);\n\n`;

        // Tablas de atributos multivaluados del rombo
        const multiValuedAttributes = AttributeTransformer.getMultiValuedAttributes(relation as any, erModel);
        for (const mvAttr of multiValuedAttributes) {
            const mvRootName = SQLUtils.parseNameAndType(mvAttr.name).name;
            const newTableName = `${relationName}_${mvRootName}`;

            const mvColumns = primaryKeys.map(pkName => columns.find(c => c.trim().startsWith(pkName + ' '))!);
            const currentAttrNames: string[] = [];
            const childrenNodes = AttributeTransformer.getChildrenNodes(mvAttr.id, erModel);

            const nodesToProcess = childrenNodes.length > 0 ? childrenNodes : [mvAttr];
            for (const node of nodesToProcess) {
                const { name, type } = SQLUtils.parseNameAndType(node.name);
                const isOptional = erModel.optionalAttributeEdges.some(e => e.sourceId === mvAttr.id && e.targetId === node.id);
                mvColumns.push(`    ${name} ${type} ${isOptional ? 'NULL' : 'NOT NULL'}`);
                if (!isOptional) currentAttrNames.push(name);
            }

            const allPkNames = [...primaryKeys, ...currentAttrNames];
            const tableLines = [
                ...mvColumns,
                `    PRIMARY KEY (${allPkNames.join(', ')})`,
                `    FOREIGN KEY (${primaryKeys.join(', ')}) REFERENCES ${relationName}(${primaryKeys.join(', ')}) ON DELETE CASCADE`
            ];
            sql += `CREATE TABLE ${newTableName} (\n${tableLines.join(',\n')}\n);\n\n`;
        }

        return { name: relationName, sql, dependencies };
    }

    /**
     * Decide si las PKs de una entidad participante deben formar parte de la PRIMARY KEY
     * de la tabla intermedia. Para binarias N:M siempre sí. Para ternarias, depende
     * de la cardinalidad de la relación y de la arista de esa entidad.
     */
    private static goesIntoPK(edge: { description: string }, relation: BaseRelation, isTernary: boolean, currentPKs: string[], allEdges: { description: string }[]): boolean {
        if (!isTernary) return true; // Binaria N:M: ambas entidades siempre en PK

        const edgeDesc = (edge.description || "").toUpperCase();
        const cardinality = (relation.cardinality || "").toUpperCase();

        if (cardinality === 'N:M:P') return true;                          // Las 3 entidades en PK
        if (cardinality === '1:N:M') return edgeDesc.includes('..N');      // Solo las del lado N/M
        if (cardinality === '1:1:N') return edgeDesc.includes('..1');      // Las 2 del lado 1
        if (cardinality === '1:1:1') return currentPKs.length < 2;        // Cualquier combinación de 2
        return true; // Fallback para casos no contemplados
    }

    /**
     * Devuelve true si la relación necesita una tabla intermedia propia:
     * - Binaria N:M (incluyendo reflexiva N:M)
     * - Cualquier relación ternaria (siempre genera tabla intermedia)
     */
    public static needsJunctionTable(relation: BaseRelation, erModel: ErModel): boolean {
        const connectedEdges = (erModel.weightedEdges || []).filter(e => e.targetId === relation.id);

        if (connectedEdges.length >= 3) return true; // Ternaria → siempre tabla propia

        if (connectedEdges.length === 2) {
            const manyCount = connectedEdges.filter(e => SQLUtils.isMany(e.description)).length;
            return manyCount >= 2; // Binaria N:M (incluyendo reflexiva N:M)
        }

        return false;
    }

    public static connectedEntities(relation: BaseRelation, erModel: ErModel): (Entity | WeakEntity)[] {
        const edges = (erModel.weightedEdges || []).filter(e => e.targetId === relation.id);
        const allEntities = [...(erModel.entities || []), ...(erModel.weakEntities || [])];
        return edges
            .map(e => allEntities.find(ent => ent.id === e.sourceId))
            .filter((e): e is Entity | WeakEntity => !!e);
    }

    private static findEntityByEdge(sourceId: string, erModel: ErModel): Entity | WeakEntity | undefined {
        return [...(erModel.entities || []), ...(erModel.weakEntities || [])].find(e => e.id === sourceId);
    }
}
