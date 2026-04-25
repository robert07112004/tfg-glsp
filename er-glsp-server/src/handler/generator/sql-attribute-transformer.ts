import { AlternativeKeyAttribute, Attribute, Entity, ErModel, ErNode, KeyAttribute, MultiValuedAttribute } from "../../model/er-model";
import { SQLUtils } from "./sql-utils";

export class AttributeTransformer {

    public static getPks(entity: Entity, erModel: ErModel): KeyAttribute[] {
        const transitionsOfEntity = erModel.transitions.filter(transition => transition.sourceId === entity.id);
        const targetIds = transitionsOfEntity.map(t => t.targetId);
        return erModel.keyAttributes.filter(pk => targetIds.includes(pk.id));
    }

    public static getAlternativeKeys(entity: Entity, erModel: ErModel): AlternativeKeyAttribute[] {
        const transitionsOfEntity = erModel.transitions.filter(transition => transition.sourceId === entity.id);
        const targetIds = transitionsOfEntity.map(t => t.targetId);
        return erModel.alternativeKeyAttributes.filter(attr => targetIds.includes(attr.id));
    }

    public static getSimpleAttributes(entity: Entity, erModel: ErModel): Attribute[] {
        const transitionsOfEntity = erModel.transitions.filter(transition => transition.sourceId === entity.id);
        const targetIds = transitionsOfEntity.map(t => t.targetId);
        return erModel.attributes.filter(attr => targetIds.includes(attr.id));
    }

    public static getOptionalAttributes(entity: Entity, erModel: ErModel): Attribute[] {
        const optionalEdges = erModel.optionalAttributeEdges.filter(edge => edge.sourceId === entity.id);
        const targetIds = optionalEdges.map(edge => edge.targetId);
        return erModel.attributes.filter(attr => targetIds.includes(attr.id));
    }

    public static getMultiValuedAttributes(entity: Entity, erModel: ErModel): MultiValuedAttribute[] {
        const transitionsOfEntity = erModel.transitions.filter(transition => transition.sourceId === entity.id);
        const targetIds = transitionsOfEntity.map(t => t.targetId);
        return erModel.multiValuedAttributes.filter(attr => targetIds.includes(attr.id));
    }

    public static processPKs(pks: KeyAttribute[]): { columns: string[], primaryKeyConstraint: string } {
        const columns: string[] = [];
        const pkNames: string[] = [];

        for (const pk of pks) {
            const { name, type } = SQLUtils.parseNameAndType(pk.name);
            columns.push(`    ${name} ${type} NOT NULL`);
            pkNames.push(name);
        }

        const primaryKeyConstraint = pkNames.length > 0 ? `    PRIMARY KEY (${pkNames.join(', ')})` : '';
        return { columns, primaryKeyConstraint };
    }

    public static processAlternativeKeys(altKeys: AlternativeKeyAttribute[], erModel: ErModel): { columns: string[], uniqueConstraints: string[] } {
        const columns: string[] = [];
        const uniqueConstraints: string[] = [];

        for (const ak of altKeys) {
            const isParentNullable = this.isNullable(ak, erModel);
            const nullableStr = isParentNullable ? 'NULL' : 'NOT NULL';

            if (this.hasChildren(ak, erModel)) {
                const childrenIds: string[] = this.getChildren(ak, erModel);
                const childColumnNames: string[] = [];

                for (const childId of childrenIds) {
                    const childNode = this.findAttributeNode(childId, erModel);

                    if (childNode) {
                        const { name, type } = SQLUtils.parseNameAndType(childNode.name);
                        const isChildOptionalEdge = erModel.optionalAttributeEdges.some(e => e.sourceId === ak.id && e.targetId === childId);
                        const childNullableStr = (isParentNullable || isChildOptionalEdge) ? 'NULL' : 'NOT NULL';

                        columns.push(`    ${name} ${type} ${childNullableStr}`);
                        childColumnNames.push(name);
                    }
                }

                if (childColumnNames.length > 0) uniqueConstraints.push(`    UNIQUE (${childColumnNames.join(', ')})`);
            } else {
                const { name, type } = SQLUtils.parseNameAndType(ak.name);
                columns.push(`    ${name} ${type} UNIQUE ${nullableStr}`);
            }

        }

        return { columns, uniqueConstraints };
    }

    public static processAttributes(attributes: Attribute[], erModel: ErModel): string[] {
        const columns: string[] = [];

        for (const attr of attributes) {
            const isParentNullable = this.isNullable(attr, erModel);
            const nullableStr = isParentNullable ? 'NULL' : 'NOT NULL';

            if (this.hasChildren(attr, erModel)) {
                const childrenIds: string[] = this.getChildren(attr, erModel);

                for (const childId of childrenIds) {
                    const childNode = this.findAttributeNode(childId, erModel);

                    if (childNode) {
                        const { name, type } = SQLUtils.parseNameAndType(childNode.name);
                        const isChildOptionalEdge = erModel.optionalAttributeEdges.some(e => e.sourceId === attr.id && e.targetId === childId);
                        const childNullableStr = (isParentNullable || isChildOptionalEdge) ? 'NULL' : 'NOT NULL';

                        columns.push(`    ${name} ${type} ${childNullableStr}`);
                    }
                }
            } else {
                const { name, type } = SQLUtils.parseNameAndType(attr.name);
                columns.push(`    ${name} ${type} ${nullableStr}`);
            }
        }

        return columns;
    }

    public static processMultiValuedAttributes(multiValuedAttrs: MultiValuedAttribute[], parentEntity: Entity, erModel: ErModel): string[] {
        const createTableStatements: string[] = [];

        const parentTableName = SQLUtils.parseNameAndType(parentEntity.name).name;
        const parentPks = this.getPks(parentEntity, erModel);

        const parentPkColumns: string[] = [];
        const parentPkNames: string[] = [];

        for (const pk of parentPks) {
            const { name, type } = SQLUtils.parseNameAndType(pk.name);
            parentPkColumns.push(`    ${name} ${type} NOT NULL`);
            parentPkNames.push(name);
        }

        for (const mvAttr of multiValuedAttrs) {
            const { name: mvRootName } = SQLUtils.parseNameAndType(mvAttr.name);
            const newTableName = `${parentTableName}_${mvRootName}`;

            const columns: string[] = [...parentPkColumns];
            const currentAttrNames: string[] = [];

            if (this.hasChildren(mvAttr, erModel)) {
                const childrenIds = this.getChildren(mvAttr, erModel);
                for (const childId of childrenIds) {
                    const childNode = this.findAttributeNode(childId, erModel);
                    if (childNode) {
                        const { name, type } = SQLUtils.parseNameAndType(childNode.name);
                        columns.push(`    ${name} ${type} NOT NULL`);
                        currentAttrNames.push(name);
                    }
                }
            } else {
                const { name, type } = SQLUtils.parseNameAndType(mvAttr.name);
                columns.push(`    ${name} ${type} NOT NULL`);
                currentAttrNames.push(name);
            }

            const allPkNames = [...parentPkNames, ...currentAttrNames];
            const pkConstraint = `    PRIMARY KEY (${allPkNames.join(', ')})`;

            let fkConstraint = "";
            if (parentPkNames.length > 0) {
                fkConstraint = `    FOREIGN KEY (${parentPkNames.join(', ')}) REFERENCES ${parentTableName}(${parentPkNames.join(', ')}) ON DELETE CASCADE`;
            }

            const tableLines = [...columns, pkConstraint];
            if (fkConstraint) tableLines.push(fkConstraint);

            const tableSql = `CREATE TABLE ${newTableName} (\n${tableLines.join(',\n')}\n);\n`;
            createTableStatements.push(tableSql);
        }

        return createTableStatements;
    }

    private static isNullable(attribute: ErNode, erModel: ErModel): boolean | undefined {
        return erModel.optionalAttributeEdges.some(edge => edge.targetId === attribute.id);
    }

    private static hasChildren(attribute: ErNode, erModel: ErModel): boolean {
        for (const transition of erModel.transitions) {
            if (transition.sourceId === attribute.id) return true;
        }

        for (const optionalEdge of erModel.optionalAttributeEdges) {
            if (optionalEdge.sourceId === attribute.id) return true;
        }

        return false;
    }

    private static getChildren(attribute: ErNode, erModel: ErModel): string[] {
        const getTransitions = erModel.transitions.filter(transition => transition.sourceId === attribute.id);
        const getOptionalEdges = erModel.optionalAttributeEdges.filter(optionalEdge => optionalEdge.sourceId === attribute.id);

        const targetIds = getTransitions.map(t => t.targetId);
        const targetOptionalIds = getOptionalEdges.map(o => o.targetId);

        return [...targetIds, ...targetOptionalIds];
    }

    private static findAttributeNode(id: string, erModel: ErModel): ErNode | undefined {
        return erModel.attributes.find(a => a.id === id) ||
            erModel.alternativeKeyAttributes.find(a => a.id === id) ||
            erModel.keyAttributes.find(a => a.id === id) ||
            erModel.multiValuedAttributes.find(a => a.id === id);
    }

}