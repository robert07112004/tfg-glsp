import { Entity, ErModel, WeakEntity, WeightedEdge } from "../../model/er-model";
import { AttributeTransformer } from "./sql-attribute-transformer";
import { FullPK, GeneratedTable, SpecInfo } from "./sql-interfaces";
import { SpecializationTransformer } from "./sql-specialization-transformer";
import { SQLUtils } from "./sql-utils";

export class EntityTransformer {

    // Generates the SQL table for strong and weak entities
    public static generateEntityTable(entity: Entity | WeakEntity, erModel: ErModel, specByFather: Map<string, SpecInfo[]>, specByChild: Map<string, SpecInfo>): GeneratedTable {
        const asChildSpec = specByChild.get(entity.id);
        const asFatherSpecs = specByFather.get(entity.id) ?? [];

        if (asChildSpec) return this.generateSubclassTable(entity, erModel, asChildSpec, asFatherSpecs);
        return this.generateBaseTable(entity, erModel, asFatherSpecs);
    }

    // Generates the table for an entity that is a subclass within a specialization
    private static generateSubclassTable(entity: Entity | WeakEntity, erModel: ErModel, specInfo: SpecInfo, asFatherSpecs: SpecInfo[] = []): GeneratedTable {
        const tableName = SQLUtils.parseNameAndType(entity.name).name;
        const dependencies = new Set<string>();
        dependencies.add(specInfo.fatherName);

        const columns: string[] = [];
        const foreignKeys: string[] = [];
        const extraConstraints: string[] = [];

        const allEntities = [...(erModel.entities || []), ...(erModel.weakEntities || [])];
        const father = allEntities.find(e => e.id === specInfo.fatherId)!;
        const fatherFullPKs = this.getEntityFullPKs(father, erModel);
        const pkNames: string[] = [];

        for (const pk of fatherFullPKs) {
            columns.push(`    ${pk.colNameInThisTable} ${pk.type} NOT NULL`);
            pkNames.push(pk.colNameInThisTable);
        }

        const isExclusive = specInfo.specType === 'totalExclusiveSpecialization' ||
            specInfo.specType === 'partialExclusiveSpecialization';
        const isOverlapping = specInfo.specType === 'totalOverlappedSpecialization' ||
            specInfo.specType === 'partialOverlappedSpecialization';

        if (isExclusive) {
            const discriminatorCol = specInfo.discriminatorCol ?? `tipo_${specInfo.fatherName}`;
            columns.push(`    tipo VARCHAR(20) DEFAULT '${tableName}' NOT NULL`);
            extraConstraints.push(`    CHECK (tipo = '${tableName}')`);
            const fkColsEx = [...pkNames, 'tipo'].join(', ');
            const refColsEx = [...pkNames, discriminatorCol].join(', ');
            foreignKeys.push(`    FOREIGN KEY (${fkColsEx}) REFERENCES ${specInfo.fatherName}(${refColsEx}) ON DELETE CASCADE`);
        } else if (isOverlapping) {
            const discriminatorCol = `es_${tableName}`;
            columns.push(`    tipo BOOLEAN DEFAULT TRUE NOT NULL`);
            extraConstraints.push(`    CHECK (tipo = TRUE)`);
            const fkColsOv = [...pkNames, 'tipo'].join(', ');
            const refColsOv = [...pkNames, discriminatorCol].join(', ');
            foreignKeys.push(`    FOREIGN KEY (${fkColsOv}) REFERENCES ${specInfo.fatherName}(${refColsOv}) ON DELETE CASCADE`);
        } else {
            const fkCols = pkNames.join(', ');
            foreignKeys.push(`    FOREIGN KEY (${fkCols}) REFERENCES ${specInfo.fatherName}(${fkCols}) ON DELETE CASCADE`);
        }

        const altKeys = AttributeTransformer.getAlternativeKeys(entity, erModel);
        const simples = AttributeTransformer.getSimpleAttributes(entity, erModel);
        const optionals = AttributeTransformer.getOptionalAttributes(entity, erModel);
        const multiValued = AttributeTransformer.getMultiValuedAttributes(entity, erModel);

        columns.push(...AttributeTransformer.processAttributes([...simples, ...optionals], erModel));

        const { columns: akCols, uniqueConstraints } = AttributeTransformer.processAlternativeKeys(altKeys, erModel);
        columns.push(...akCols);
        extraConstraints.push(...uniqueConstraints);

        const binaryData = this.processBinaryRelations(entity, erModel);
        columns.push(...binaryData.columns);
        foreignKeys.push(...binaryData.foreignKeys);
        extraConstraints.push(...binaryData.uniqueConstraints);
        binaryData.dependencies.forEach(d => dependencies.add(d));

        const extraTables = AttributeTransformer.processMultiValuedAttributes(multiValued, entity, erModel, fatherFullPKs);

        for (const fatherSpec of asFatherSpecs) {
            const specCols = SpecializationTransformer.buildFatherDiscriminatorColumns(tableName, fatherSpec);
            columns.push(...specCols.columns);
            extraConstraints.push(...specCols.constraints);
            if (pkNames.length > 0) {
                const { specType, childNames } = fatherSpec;
                if (specType === 'totalExclusiveSpecialization' || specType === 'partialExclusiveSpecialization') {
                    extraConstraints.push(`    UNIQUE (${pkNames.join(', ')}, ${fatherSpec.discriminatorCol!})`);
                } else if (specType === 'totalOverlappedSpecialization' || specType === 'partialOverlappedSpecialization') {
                    for (const childName of childNames) {
                        extraConstraints.push(`    UNIQUE (${pkNames.join(', ')}, es_${childName})`);
                    }
                }
            }
        }

        let sql = `CREATE TABLE ${tableName} (\n`;
        const allDefs = [...columns];
        if (pkNames.length > 0) allDefs.push(`    PRIMARY KEY (${pkNames.join(', ')})`);
        allDefs.push(...extraConstraints);
        allDefs.push(...foreignKeys);
        sql += allDefs.join(',\n') + '\n);\n\n';

        if (extraTables.length > 0) sql += extraTables.join('\n') + '\n';

        return { name: tableName, sql, dependencies: Array.from(dependencies) };
    }

    // Generates the table for a strong or weak entity (and optionally a specialization parent)
    private static generateBaseTable(entity: Entity | WeakEntity, erModel: ErModel, asFatherSpecs: SpecInfo[]): GeneratedTable {
        const tableName = SQLUtils.parseNameAndType(entity.name).name;
        const isWeak = entity.type === 'weakEntity';
        const dependencies = new Set<string>();

        const pks = AttributeTransformer.getPks(entity, erModel);
        const altKeys = AttributeTransformer.getAlternativeKeys(entity, erModel);
        let simples = AttributeTransformer.getSimpleAttributes(entity, erModel);
        const optionals = AttributeTransformer.getOptionalAttributes(entity, erModel);
        const multiValued = AttributeTransformer.getMultiValuedAttributes(entity, erModel);

        const columns: string[] = [];
        const foreignKeys: string[] = [];
        const extraConstraints: string[] = [];
        const pkNames: string[] = [];

        const fullPks = this.getEntityFullPKs(entity, erModel);
        for (const pk of fullPks) {
            columns.push(`    ${pk.colNameInThisTable} ${pk.type} NOT NULL`);
            pkNames.push(pk.colNameInThisTable);
        }

        const pkIds = pks.map(p => p.id);
        const discriminators = isWeak ? AttributeTransformer.getDiscriminator(entity, erModel) : [];
        const discIds = discriminators.map(d => d.id);
        const discChildIds = discriminators.flatMap(d => AttributeTransformer.getChildrenNodes(d.id, erModel).map(c => c.id));
        simples = simples.filter(s => !pkIds.includes(s.id) && !discIds.includes(s.id) && !discChildIds.includes(s.id));

        const absorbedEntityIds = new Set<string>();
        if (isWeak) {
            const identData = this.processIdentifyingRelations(entity as WeakEntity, erModel, discIds, absorbedEntityIds);
            columns.push(...identData.columns);
            foreignKeys.push(...identData.foreignKeys);
            identData.dependencies.forEach(d => dependencies.add(d));
        }

        columns.push(...AttributeTransformer.processAttributes([...simples, ...optionals], erModel));

        const { columns: akCols, uniqueConstraints } = AttributeTransformer.processAlternativeKeys(altKeys, erModel);
        columns.push(...akCols);
        extraConstraints.push(...uniqueConstraints);

        for (const asFatherSpec of asFatherSpecs) {
            const specCols = SpecializationTransformer.buildFatherDiscriminatorColumns(tableName, asFatherSpec);
            columns.push(...specCols.columns);
            extraConstraints.push(...specCols.constraints);
            if (pkNames.length > 0) {
                const { specType, childNames } = asFatherSpec;
                if (specType === 'totalExclusiveSpecialization' || specType === 'partialExclusiveSpecialization') {
                    extraConstraints.push(`    UNIQUE (${pkNames.join(', ')}, ${asFatherSpec.discriminatorCol!})`);
                } else if (specType === 'totalOverlappedSpecialization' || specType === 'partialOverlappedSpecialization') {
                    for (const childName of childNames) {
                        extraConstraints.push(`    UNIQUE (${pkNames.join(', ')}, es_${childName})`);
                    }
                }
            }
        }

        const extraTables = AttributeTransformer.processMultiValuedAttributes(multiValued, entity, erModel, fullPks);

        const binaryData = this.processBinaryRelations(entity, erModel, absorbedEntityIds);
        columns.push(...binaryData.columns);
        foreignKeys.push(...binaryData.foreignKeys);
        extraConstraints.push(...binaryData.uniqueConstraints);
        binaryData.dependencies.forEach(d => dependencies.add(d));
        extraTables.push(...binaryData.extraTables);

        let sql = `CREATE TABLE ${tableName} (\n`;
        const allDefs = [...columns];
        if (pkNames.length > 0) allDefs.push(`    PRIMARY KEY (${pkNames.join(', ')})`);
        allDefs.push(...extraConstraints);
        allDefs.push(...foreignKeys);
        sql += allDefs.join(',\n') + '\n);\n\n';

        if (extraTables.length > 0) sql += extraTables.join('\n') + '\n';

        return { name: tableName, sql, dependencies: Array.from(dependencies) };
    }

    private static isChildInRelation(entityId: string, edge1: WeightedEdge, edge2: WeightedEdge): { isChild: boolean; parentId: string | null } {
        const desc1 = (edge1.description || "").toUpperCase();
        const desc2 = (edge2.description || "").toUpperCase();
        const is1Many = SQLUtils.isMany(desc1);
        const is2Many = SQLUtils.isMany(desc2);

        let childId: string | null = null;
        let parentId: string | null = null;

        if ((is1Many && !is2Many) || (!is1Many && is2Many)) {
            childId = is1Many ? edge1.sourceId : edge2.sourceId;
            parentId = is1Many ? edge2.sourceId : edge1.sourceId;
        } else if (!is1Many && !is2Many) {
            const total1 = desc1.includes('1..1');
            const total2 = desc2.includes('1..1');
            if (total1 && !total2) { childId = edge1.sourceId; parentId = edge2.sourceId; }
            else if (!total1 && total2) { childId = edge2.sourceId; parentId = edge1.sourceId; }
            else {
                if (edge1.sourceId > edge2.sourceId) { childId = edge1.sourceId; parentId = edge2.sourceId; }
                else { childId = edge2.sourceId; parentId = edge1.sourceId; }
            }
        }
        return { isChild: childId === entityId, parentId };
    }

    public static getEntityFullPKs(entity: Entity | WeakEntity, erModel: ErModel, visited: Set<string> = new Set()): FullPK[] {
        if (visited.has(entity.id)) return [];
        visited.add(entity.id);

        const pks: FullPK[] = [];
        const addedNames = new Set<string>();
        const entityTableName = SQLUtils.parseNameAndType(entity.name).name;

        for (const pk of AttributeTransformer.getPks(entity, erModel)) {
            const parsed = SQLUtils.parseNameAndType(pk.name);
            if (!addedNames.has(parsed.name)) {
                addedNames.add(parsed.name);
                pks.push({ colNameInThisTable: parsed.name, introducer: entityTableName, originalName: parsed.name, type: parsed.type });
            }
        }

        if (entity.type === 'weakEntity') {
            for (const disc of AttributeTransformer.getDiscriminator(entity, erModel)) {
                const children = AttributeTransformer.getChildrenNodes(disc.id, erModel);
                if (children.length > 0) {
                    for (const child of children) {
                        const parsed = SQLUtils.parseNameAndType(child.name);
                        const cleanName = SQLUtils.stripDisc(parsed.name);
                        if (!addedNames.has(cleanName)) {
                            addedNames.add(cleanName);
                            pks.push({ colNameInThisTable: cleanName, introducer: entityTableName, originalName: cleanName, type: parsed.type });
                        }
                    }
                } else {
                    const parsed = SQLUtils.parseNameAndType(disc.name);
                    const cleanName = SQLUtils.stripDisc(parsed.name);
                    if (!addedNames.has(cleanName)) {
                        addedNames.add(cleanName);
                        pks.push({ colNameInThisTable: cleanName, introducer: entityTableName, originalName: cleanName, type: parsed.type });
                    }
                }
            }

            const identifyingRels = erModel.identifyingDependentRelations || [];
            const edges = erModel.weightedEdges || [];
            const connectedRels = identifyingRels.filter(rel =>
                edges.some(e => e.sourceId === entity.id && e.targetId === rel.id)
            );

            for (const rel of connectedRels) {
                const relEdges = edges.filter(e => e.targetId === rel.id);
                if (relEdges.length !== 2) continue;
                const { isChild, parentId } = this.isChildInRelation(entity.id, relEdges[0], relEdges[1]);
                if (isChild && parentId) {
                    const strongEntity = [...(erModel.entities || []), ...(erModel.weakEntities || [])].find(e => e.id === parentId);
                    if (strongEntity) {
                        for (const parentPk of this.getEntityFullPKs(strongEntity, erModel, visited)) {
                            pks.push({
                                colNameInThisTable: `${parentPk.introducer}_${parentPk.originalName}`,
                                introducer: parentPk.introducer,
                                originalName: parentPk.originalName,
                                type: parentPk.type
                            });
                        }
                    }
                }
            }
        }

        if (pks.length === 0) {
            const allSpecs = [
                ...(erModel.partialExclusiveSpecializations || []),
                ...(erModel.totalExclusiveSpecializations || []),
                ...(erModel.partialOverlappedSpecializations || []),
                ...(erModel.totalOverlappedSpecializations || [])
            ];
            const allEntities = [...(erModel.entities || []), ...(erModel.weakEntities || [])];

            for (const spec of allSpecs) {
                const isChild = (erModel.transitions || []).some(t => t.sourceId === spec.id && t.targetId === entity.id);
                if (!isChild) continue;

                const fatherTransition = (erModel.transitions || []).find(t => t.targetId === spec.id);
                if (fatherTransition) {
                    const father = allEntities.find(e => e.id === fatherTransition.sourceId);
                    if (father) pks.push(...this.getEntityFullPKs(father, erModel, visited));
                }
                break;
            }
        }

        return pks;
    }

    // Dependencies in identification
    private static processIdentifyingRelations(weakEntity: WeakEntity, erModel: ErModel, discIds: string[], absorbedEntityIds: Set<string>) {
        const result = { columns: [] as string[], foreignKeys: [] as string[], dependencies: [] as string[] };
        const identifyingRels = erModel.identifyingDependentRelations || [];
        const edges = erModel.weightedEdges || [];

        const connectedRels = identifyingRels.filter(rel =>
            edges.some(e => e.sourceId === weakEntity.id && e.targetId === rel.id)
        );

        for (const rel of connectedRels) {
            const relEdges = edges.filter(e => e.targetId === rel.id);
            if (relEdges.length !== 2) continue;
            const { isChild, parentId } = this.isChildInRelation(weakEntity.id, relEdges[0], relEdges[1]);

            if (isChild && parentId) {
                const strongEntity = [...(erModel.entities || []), ...(erModel.weakEntities || [])].find(e => e.id === parentId);
                if (strongEntity) {
                    const strongTableName = SQLUtils.parseNameAndType(strongEntity.name).name;
                    result.dependencies.push(strongTableName);
                    absorbedEntityIds.add(parentId);

                    const fkCols: string[] = [];
                    const refCols: string[] = [];
                    for (const pk of this.getEntityFullPKs(strongEntity, erModel)) {
                        const colNameInThisTable = `${pk.introducer}_${pk.originalName}`;
                        fkCols.push(colNameInThisTable);
                        refCols.push(pk.colNameInThisTable);
                    }
                    result.foreignKeys.push(`    FOREIGN KEY (${fkCols.join(', ')}) REFERENCES ${strongTableName}(${refCols.join(', ')}) ON DELETE CASCADE`);

                    const simples = AttributeTransformer.getSimpleAttributes(rel, erModel).filter(a => !discIds.includes(a.id));
                    const optionals = AttributeTransformer.getOptionalAttributes(rel, erModel).filter(a => !discIds.includes(a.id));
                    result.columns.push(...AttributeTransformer.processAttributes([...simples, ...optionals], erModel));
                }
            }
        }
        return result;
    }

    // 1:N and 1:1 binary relations
    private static processBinaryRelations(entity: Entity | WeakEntity, erModel: ErModel, preAbsorbedEntityIds: Set<string> = new Set()) {
        const result = { columns: [] as string[], foreignKeys: [] as string[], uniqueConstraints: [] as string[], extraTables: [] as string[], dependencies: [] as string[] };
        const allRelations = [...(erModel.relations || []), ...(erModel.existenceDependentRelations || [])];
        const edges = erModel.weightedEdges || [];

        const isTotal = (desc: string) => !(desc || '').includes('0');

        interface Candidate {
            relation: any;
            sourceEntityId: string;
            sourceEdge: WeightedEdge;
            participationEdge: WeightedEdge;
            isOneToOne: boolean;
            isExistence: boolean;
        }

        const candidates: Candidate[] = [];

        for (const relation of allRelations) {
            const connectedEdges = edges.filter(edge => edge.targetId === relation.id);
            if (connectedEdges.length !== 2) continue;

            const edge1 = connectedEdges[0];
            const edge2 = connectedEdges[1];
            const is1Many = SQLUtils.isMany(edge1.description || '');
            const is2Many = SQLUtils.isMany(edge2.description || '');
            const id1 = edge1.sourceId;
            const id2 = edge2.sourceId;
            const isExistence = relation.type === 'existenceDependentRelation';

            if ((is1Many && !is2Many) || (!is1Many && is2Many)) {
                const manyEdge = is1Many ? edge1 : edge2;
                const oneEdge = is1Many ? edge2 : edge1;
                if (manyEdge.sourceId === entity.id) {
                    candidates.push({ relation, sourceEntityId: oneEdge.sourceId, sourceEdge: oneEdge, participationEdge: manyEdge, isOneToOne: false, isExistence });
                }
            } else if (!is1Many && !is2Many) {
                const isReflexive = (id1 === id2 && id1 === entity.id);
                if (isReflexive) {
                    candidates.push({ relation, sourceEntityId: id1, sourceEdge: edge1, participationEdge: edge1, isOneToOne: true, isExistence });
                } else if (id1 === entity.id || id2 === entity.id) {
                    const otherId = id1 === entity.id ? id2 : id1;
                    const thisEdge = id1 === entity.id ? edge1 : edge2;
                    const otherEdge = id1 === entity.id ? edge2 : edge1;
                    const thisT = isTotal(thisEdge.description || '');
                    const otherT = isTotal(otherEdge.description || '');
                    let shouldAbsorb = false;
                    if (thisT && !otherT) shouldAbsorb = true;
                    else if (thisT === otherT && entity.id < otherId) shouldAbsorb = true;
                    if (shouldAbsorb) {
                        candidates.push({ relation, sourceEntityId: otherId, sourceEdge: otherEdge, participationEdge: thisEdge, isOneToOne: true, isExistence });
                    }
                }
            }
        }

        const sourceCount = new Map<string, number>();
        for (const id of preAbsorbedEntityIds) {
            sourceCount.set(id, (sourceCount.get(id) || 0) + 1);
        }
        for (const c of candidates) {
            sourceCount.set(c.sourceEntityId, (sourceCount.get(c.sourceEntityId) || 0) + 1);
        }

        for (const c of candidates) {
            const sourceEntity = [...(erModel.entities || []), ...(erModel.weakEntities || [])].find(e => e.id === c.sourceEntityId);
            if (!sourceEntity) continue;

            const sourceName = SQLUtils.parseNameAndType(sourceEntity.name).name;
            const relationName = SQLUtils.parseNameAndType(c.relation.name).name;
            const isReflexive = (entity.id === c.sourceEntityId);

            const colPrefix = (isReflexive || (sourceCount.get(c.sourceEntityId)! > 1))
                ? relationName
                : sourceName;

            this.absorbKey(entity, c.sourceEntityId, c.sourceEdge, c.participationEdge, c.relation, erModel, result, c.isOneToOne, c.isExistence, colPrefix);
        }

        return result;
    }

    private static absorbKey(
        currentEntity: Entity | WeakEntity,
        sourceEntityId: string,
        sourceEdge: WeightedEdge,
        participationEdge: WeightedEdge,
        relation: any,
        erModel: ErModel,
        result: { columns: string[]; foreignKeys: string[]; uniqueConstraints: string[]; extraTables: string[]; dependencies: string[] },
        isOneToOne: boolean,
        isExistence: boolean,
        colPrefix: string
    ) {
        const sourceEntity = [...(erModel.entities || []), ...(erModel.weakEntities || [])].find(e => e.id === sourceEntityId);
        if (!sourceEntity) return;

        const sourceName = SQLUtils.parseNameAndType(sourceEntity.name).name;
        const relationName = SQLUtils.parseNameAndType(relation.name).name;

        result.dependencies.push(sourceName);

        const fkCols: string[] = [];
        const refCols: string[] = [];
        const isOptional = (participationEdge.description || "").includes('0');
        const nullStr = isExistence ? 'NOT NULL' : (isOptional ? 'NULL' : 'NOT NULL');

        for (const pkNode of this.getEntityFullPKs(sourceEntity, erModel)) {
            const colName = `${colPrefix}_${pkNode.colNameInThisTable}`;
            result.columns.push(`    ${colName} ${pkNode.type} ${nullStr}`);
            fkCols.push(colName);
            refCols.push(pkNode.colNameInThisTable);
        }

        if (fkCols.length > 0) {
            if (isOneToOne) result.uniqueConstraints.push(`    UNIQUE (${fkCols.join(', ')})`);
            const deleteAction = isExistence ? 'ON DELETE CASCADE' : (isOptional ? 'ON DELETE SET NULL' : 'ON DELETE NO ACTION');
            result.foreignKeys.push(`    FOREIGN KEY (${fkCols.join(', ')}) REFERENCES ${sourceName}(${refCols.join(', ')}) ${deleteAction}`);
        }

        const simples = AttributeTransformer.getSimpleAttributes(relation, erModel);
        const optionals = AttributeTransformer.getOptionalAttributes(relation, erModel);
        result.columns.push(...AttributeTransformer.processAttributes([...simples, ...optionals], erModel, isOptional));

        const mva = AttributeTransformer.getMultiValuedAttributes(relation, erModel);
        if (mva.length > 0) {
            const fullPKs = this.getEntityFullPKs(currentEntity, erModel);
            const mvTables = AttributeTransformer.processMultiValuedAttributes(mva, currentEntity, erModel, fullPKs);
            const currentName = SQLUtils.parseNameAndType(currentEntity.name).name;
            const renamed = mvTables.map(t => t.replace(`CREATE TABLE ${currentName}_`, `CREATE TABLE ${currentName}_${relationName}_`));
            result.extraTables.push(...renamed);
        }
    }
}
