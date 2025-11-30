import { GModelElement, GModelIndex, GNode } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { ENTITY_TYPE, RELATION_TYPE, WEAK_ENTITY_TYPE } from '../validation/utils/validation-constants';
import { isGNode, ModelUtils } from './model-utils';
import { SQLFormatter } from './sql-formatter';
import { TableMapper } from './table-mapper';

@injectable()
export class SQLGeneratorV2 {

    public generate(root: GModelElement, index: GModelIndex): string {
        let sqlScript = "-- Script generado por GLSP-ER\n";
        sqlScript += "-- Fecha: " + new Date().toLocaleString() + "\n\n";
        
        const nodes = root.children.filter(isGNode);

        nodes.filter(n => n.type === ENTITY_TYPE).forEach(entity => {
            sqlScript += this.processEntity(entity, root) + "\n";
        });

        nodes.filter(n => n.type === WEAK_ENTITY_TYPE).forEach(weak => {
            sqlScript += this.processWeakEntity(weak, root) + "\n";
        });

        nodes.filter(n => n.type === RELATION_TYPE).forEach(rel => {
            sqlScript += this.processManyToManyRelation(rel, root) + "\n";
        });

        return sqlScript;
    }

    private processEntity(entity: GNode, root: GModelElement): string {
        const tableName = SQLFormatter.getSafeName(entity);
        const allCols: string[] = [];
        const allFKs: string[] = [];
        const allPKs: string[] = [];
        let extraSql = "";

        // SPECIALIZATION
        const specInfo = TableMapper.getSpecializationInfo(entity, root);
        if (specInfo.cols.length > 0) {
            allCols.push(...specInfo.cols);
            allFKs.push(...specInfo.fks);
            allPKs.push(...specInfo.pks);
        }

        // ATTRIBUTES
        const { cols, additionalSql } = TableMapper.getAttributeDefinitions(entity, root);
        allCols.push(...cols);
        extraSql += additionalSql;

        // FOREIGN KEYS
        const relInfo = TableMapper.getRelationForeignKeys(entity, root);
        allCols.push(...relInfo.cols);
        allFKs.push(...relInfo.fks);

        return SQLFormatter.buildCreateTable(tableName, allCols, allFKs, allPKs) + extraSql;
    }

    private processWeakEntity(entity: GNode, root: GModelElement): string {
        const tableName = SQLFormatter.getSafeName(entity);
        const allCols: string[] = [];
        const allFKs: string[] = [];
        const allPKs: string[] = [];
        let extraSql = "";

        // ATTRIBUTES
        const { cols, additionalSql } = TableMapper.getAttributeDefinitions(entity, root);
        allCols.push(...cols);
        extraSql += additionalSql;

        // FOREIGN KEYS
        const identity = TableMapper.getWeakEntityIdentity(entity, root);
        allCols.push(...identity.cols);
        allFKs.push(...identity.fks);
        allPKs.push(...identity.pks);

        return SQLFormatter.buildCreateTable(tableName, allCols, allFKs, allPKs) + extraSql;
    }

    private processManyToManyRelation(relation: GNode, root: GModelElement): string {
        const cardinality = ModelUtils.getCardinality(relation);
        if (!cardinality.includes('N:M')) return "";

        const tableName = SQLFormatter.getSafeName(relation);
        const cols: string[] = [];
        const fks: string[] = [];
        const pks: string[] = [];

        const entities = ModelUtils.findConnectedEntities(relation, root);
        entities.forEach(ent => {
            const pk = ModelUtils.findPrimaryKey(ent, root);
            if(pk) {
                const entName = SQLFormatter.getSafeName(ent);
                const pkLabel = SQLFormatter.getSafeName(pk);
                const pkInfo = SQLFormatter.splitLabelAttribute(pkLabel);
                
                const colName = `${entName}_${pkInfo.name}`;
                
                cols.push(`    ${colName} ${pkInfo.type} NOT NULL`);
                pks.push(colName);
                fks.push(`    FOREIGN KEY (${colName}) REFERENCES ${entName}(${pkInfo.name}) ON DELETE CASCADE`);
            }
        });

        const { cols: attrCols } = TableMapper.getAttributeDefinitions(relation, root);
        cols.push(...attrCols);

        return SQLFormatter.buildCreateTable(tableName, cols, fks, pks);
    }

}
