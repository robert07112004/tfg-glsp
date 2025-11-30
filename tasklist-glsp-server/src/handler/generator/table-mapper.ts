import { GModelElement, GNode } from '@eclipse-glsp/server';
import {
    ALTERNATIVE_KEY_ATTRIBUTE_TYPE, ATTRIBUTE_TYPE,
    DERIVED_ATTRIBUTE_TYPE,
    EXISTENCE_DEP_RELATION_TYPE,
    KEY_ATTRIBUTE_TYPE,
    MULTI_VALUED_ATTRIBUTE_TYPE, OPTIONAL_EDGE_TYPE,
    WEAK_ENTITY_TYPE
} from '../validation/utils/validation-constants';
import { ModelUtils } from './model-utils';
import { SQLFormatter } from './sql-formatter';

export class TableMapper {

    static getAttributeDefinitions(node: GNode, root: GModelElement): { cols: string[], additionalSql: string } {
        const columns: string[] = [];
        let additionalSql = "";
        
        let attributes = ModelUtils.findConnectedAttributes(node, root);
        attributes = SQLFormatter.sortAttributes(attributes);
        
        attributes.forEach(attr => {
            const safeLabel = SQLFormatter.getSafeName(attr);
            const { name, type } = SQLFormatter.splitLabelAttribute(safeLabel);
            let colDef = "";

            switch (attr.type) {
                case KEY_ATTRIBUTE_TYPE:
                    colDef = `    ${name} ${type} PRIMARY KEY`;
                    break;
                case ALTERNATIVE_KEY_ATTRIBUTE_TYPE:
                    colDef = `    ${name} ${type} UNIQUE`;
                    break;
                case ATTRIBUTE_TYPE:
                    const composite = ModelUtils.findConnectedAttributes(attr, root);
                    if (composite.length > 0) {
                        composite.forEach(c => {
                            const cLabel = SQLFormatter.getSafeName(c);
                            const cInfo = SQLFormatter.splitLabelAttribute(cLabel);
                            columns.push(`    ${cInfo.name} ${cInfo.type} NOT NULL`);
                        });
                        return;
                    } else {
                        const edge = ModelUtils.findEdgeBetween(node, attr, root);
                        const isOptional = edge && edge.type === OPTIONAL_EDGE_TYPE;
                        colDef = `    ${name} ${type} ${isOptional ? 'NULL' : 'NOT NULL'}`;
                    }
                    break; 
                case DERIVED_ATTRIBUTE_TYPE:
                    const labelEq = ModelUtils.getEquationFromDerivedAttribute(attr);
                    if (labelEq) colDef = `    ${name} ${type} GENERATED ALWAYS AS (${labelEq}) STORED`;
                    break;
                case MULTI_VALUED_ATTRIBUTE_TYPE:
                    additionalSql += "\n" + this.generateMultiValuedTable(node, attr, root);
                    break;
            }

            if (colDef) columns.push(colDef);
        });

        return { cols: columns, additionalSql };
    }

    static generateMultiValuedTable(parent: GNode, attr: GNode, root: GModelElement): string {
        const parentName = SQLFormatter.getSafeName(parent);
        const attrLabel = SQLFormatter.getSafeName(attr);
        const { name: attrName, type: attrType } = SQLFormatter.splitLabelAttribute(attrLabel);
        
        const tableName = `${attrName}_${parentName}`;
        const pkNode = ModelUtils.findPrimaryKey(parent, root);
        
        if (!pkNode) return `-- Error: No PK for multivalue table ${tableName}`;
        
        const pkLabel = SQLFormatter.getSafeName(pkNode);
        const { name: pkName, type: pkType } = SQLFormatter.splitLabelAttribute(pkLabel);

        const cols = [
            `    ${pkName} ${pkType}`,
            `    ${attrName} ${attrType}`
        ];
        
        const fks = [`    FOREIGN KEY (${pkName}) REFERENCES ${parentName}(${pkName}) ON DELETE CASCADE`];
        return SQLFormatter.buildCreateTable(tableName, cols, fks, [pkName, attrName]);
    }

    static getWeakEntityIdentity(weakEntity: GNode, root: GModelElement): { cols: string[], fks: string[], pks: string[] } {
        const cols: string[] = [];
        const fks: string[] = [];
        const pks: string[] = [];

        const dependenceRelations = ModelUtils.findConnectedDependenceRelations(weakEntity, root);

        dependenceRelations.forEach(relation => {
            const relationCardinality = ModelUtils.getCardinality(relation);
            const otherEntity = ModelUtils.findOtherEntity(relation, weakEntity, root);
            
            if (!otherEntity) return;

            const otherEntityPK = ModelUtils.findPrimaryKey(otherEntity, root);
            
            if (!otherEntityPK) return;
            
            const otherEntityName = SQLFormatter.getSafeName(otherEntity);
            const otherEntityPKLabel = SQLFormatter.getSafeName(otherEntityPK);
            const { name: pkName, type: pkType } = SQLFormatter.splitLabelAttribute(otherEntityPKLabel);
            
            const fkColumnName = `${otherEntityName}_${pkName}`;

            cols.push(`    ${fkColumnName} ${pkType} NOT NULL`);
            fks.push(`    FOREIGN KEY (${fkColumnName}) REFERENCES ${otherEntityName}(${pkName}) ON DELETE CASCADE`);
            
            if (relation.type === EXISTENCE_DEP_RELATION_TYPE) {
                const weakEntityPK = ModelUtils.findPrimaryKey(weakEntity, root);                
                if (!weakEntityPK) return;

                const weakEntityPKLabel = SQLFormatter.getSafeName(weakEntityPK);
                const { name: weakPkName } = SQLFormatter.splitLabelAttribute(weakEntityPKLabel);

                if (relationCardinality === '1:N') {
                    pks.push(`${weakPkName}, ${fkColumnName}`);
                } else {
                    pks.push(fkColumnName);
                }
                // TEORICAMENTE MOSTRAR ATRIBUTOS
            } else {
                const identifyingRelationPK = ModelUtils.findPrimaryKey(relation, root);
                if (!identifyingRelationPK) return;

                const identifyingRelationPKLabel = SQLFormatter.getSafeName(identifyingRelationPK);
                const { name: identifyingPkName, type: identifyingPkType } = SQLFormatter.splitLabelAttribute(identifyingRelationPKLabel);
                cols.unshift(`    ${identifyingPkName} ${identifyingPkType} NOT NULL`);

                if (relationCardinality === '1:N') {
                    pks.push(`${identifyingPkName}, ${fkColumnName}`);
                } else {
                    pks.push(`${fkColumnName}`);
                }
                // TEORICAMENTE MOSTRAR ATRIBUTOS
            }
        });

        return { cols, fks, pks };
    }

    static getSpecializationInfo(entity: GNode, root: GModelElement): { cols: string[], fks: string[], pks: string[] } {
        const cols: string[] = [];
        const fks: string[] = [];
        const pks: string[] = [];
        let subclassSpecializationPK = "";
        let subclassSpecializationFK = "";
        
        const parentEntity = ModelUtils.findParentFromSpecialization(entity, root);
        const isChild = !!parentEntity;

        if (isChild && parentEntity) {
            const identityColumns = ModelUtils.getIdentityColumns(parentEntity, root);
            const safeParentEntityName = SQLFormatter.getSafeName(parentEntity);
            if (identityColumns.length == 1) {
                for (const column of identityColumns) {
                    cols.push(`    ${column.name} ${column.type} NOT NULL`);
                    if (parentEntity.type === WEAK_ENTITY_TYPE) {
                        pks.push(`${column.name}`);
                    }
                    fks.push(`    FOREIGN KEY (${column.name}) REFERENCES ${safeParentEntityName}(${column.name}) ON DELETE CASCADE`);
                }
            } else {
                for (const column of identityColumns) {
                    cols.push(`    ${column.name} ${column.type} NOT NULL`);
                    subclassSpecializationPK += `${column.name}, `; 
                    subclassSpecializationFK += `${column.name}, `;
                }
                subclassSpecializationPK = subclassSpecializationPK.slice(0, -2);
                subclassSpecializationFK = subclassSpecializationFK.slice(0, -2);
                pks.push(`${subclassSpecializationPK}`);
                fks.push(`    FOREIGN KEY (${subclassSpecializationFK}) REFERENCES ${safeParentEntityName}(${subclassSpecializationFK}) ON DELETE CASCADE`);
            }
        }

        return { cols, fks, pks };
    }

    static getRelationForeignKeys(entity: GNode, root: GModelElement): { cols: string[], fks: string[] } {
        const cols: string[] = [];
        const fks: string[] = [];

        const relations = ModelUtils.findConnectedRelations(entity, root);

        relations.forEach(relation => {
            const cardinality = ModelUtils.getCardinality(relation);
            const otherEntity = ModelUtils.findOtherEntity(relation, entity, root);
            
            if (otherEntity) {
                const myEdge = ModelUtils.findEdgeBetween(entity, relation, root);
                const edgeCard = myEdge ? ModelUtils.getCardinality(myEdge) : '';

                if (cardinality === '1:N' && edgeCard.includes('..1')) {
                this.addForeignKeyDef(cols, fks, otherEntity, root, false);
                }
                
                if (cardinality === '1:1') {
                    const otherEdge = ModelUtils.findEdgeBetween(otherEntity, relation, root);
                    const otherCard = otherEdge ? ModelUtils.getCardinality(otherEdge) : '';
                    
                    const iAmMandatory = edgeCard.includes('1..1');
                    const otherIsMandatory = otherCard.includes('1..1');
                    let iAmResponsible = false;
                    
                    if (iAmMandatory && !otherIsMandatory) iAmResponsible = true;
                    else if (!iAmMandatory && otherIsMandatory) iAmResponsible = false;
                    else if (entity.id > otherEntity.id) iAmResponsible = true;

                    if (iAmResponsible) {
                        this.addForeignKeyDef(cols, fks, otherEntity, root, true);
                    }
                }
            } else {
                const connectedNodes = ModelUtils.findConnectedEntities(relation, root);
                const isReflexive = connectedNodes.length > 0 && connectedNodes.every(n => n.id === entity.id);

                if (isReflexive) {
                    if (cardinality === '1:1') {
                        this.addReflexiveForeignKey(cols, fks, entity, relation, root, true);
                    } 
                    else if (cardinality === '1:N') {
                        this.addReflexiveForeignKey(cols, fks, entity, relation, root, false);
                    }
                }
            }

        });
        
        return { cols, fks};
    }

    private static addForeignKeyDef(cols: string[], fks: string[], target: GNode, root: GModelElement, isUnique: boolean) {
        const targetPK = ModelUtils.findPrimaryKey(target, root);
        if (!targetPK) return;

        const targetName = SQLFormatter.getSafeName(target);
        const targetPKLabel = SQLFormatter.getSafeName(targetPK);
        const { name: pkName, type: pkType } = SQLFormatter.splitLabelAttribute(targetPKLabel);
        
        const colName = `${targetName}_${pkName}`;
        
        fks.push(`    ${colName} ${pkType} ${isUnique ? 'UNIQUE' : ''}`);
        fks.push(`    FOREIGN KEY (${colName}) REFERENCES ${targetName}(${pkName}) ON DELETE SET NULL`);
    }

    private static addReflexiveForeignKey(cols: string[], fks: string[], entity: GNode, relation: GNode, root: GModelElement, isUnique: boolean) {
        const entityPK = ModelUtils.findPrimaryKey(entity, root);
        if (!entityPK) return;

        const entityName = SQLFormatter.getSafeName(entity);
        const relationName = SQLFormatter.getSafeName(relation); 
        const entityPKLabel = SQLFormatter.getSafeName(entityPK);
        const { name: pkName, type: pkType } = SQLFormatter.splitLabelAttribute(entityPKLabel);

        const colName = `${relationName}_${pkName}`;

        cols.push(`    ${colName} ${pkType} ${isUnique ? 'UNIQUE' : ''}`);
        fks.push(`    FOREIGN KEY (${colName}) REFERENCES ${entityName}(${pkName}) ON DELETE SET NULL`);
    }

}