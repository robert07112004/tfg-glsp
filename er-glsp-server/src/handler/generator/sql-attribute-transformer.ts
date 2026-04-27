import { AlternativeKeyAttribute, Attribute, Entity, ErModel, ErNode, KeyAttribute, MultiValuedAttribute } from "../../model/er-model";
import { AllAttributes } from "./sql-interfaces";
import { SQLUtils } from "./sql-utils";

export class AttributeTransformer {

    private static getConnectedNodes<T extends ErNode>(nodeId: string, edges: { sourceId: string, targetId: string }[], targetCollection: T[]): T[] {
        const targetIds = edges.filter(e => e.sourceId === nodeId).map(e => e.targetId);
        return targetCollection.filter(item => targetIds.includes(item.id));
    }

    public static getPks(node: ErNode, erModel: ErModel): KeyAttribute[] {
        return this.getConnectedNodes(node.id, erModel.transitions, erModel.keyAttributes);
    }

    public static getAlternativeKeys(node: ErNode, erModel: ErModel): AlternativeKeyAttribute[] {
        return this.getConnectedNodes(node.id, erModel.transitions, erModel.alternativeKeyAttributes);
    }

    public static getSimpleAttributes(node: ErNode, erModel: ErModel): Attribute[] {
        return this.getConnectedNodes(node.id, erModel.transitions, erModel.attributes);
    }

    public static getOptionalAttributes(node: ErNode, erModel: ErModel): Attribute[] {
        return this.getConnectedNodes(node.id, erModel.optionalAttributeEdges, erModel.attributes);
    }

    public static getMultiValuedAttributes(node: ErNode, erModel: ErModel): MultiValuedAttribute[] {
        return this.getConnectedNodes(node.id, erModel.transitions, erModel.multiValuedAttributes);
    }

    public static getAllAtributes(node: ErNode, erModel: ErModel): AllAttributes {
        return {
            pk: this.getPks(node, erModel),
            unique: this.getAlternativeKeys(node, erModel),
            simple: this.getSimpleAttributes(node, erModel),
            optional: this.getOptionalAttributes(node, erModel),
            multiValued: this.getMultiValuedAttributes(node, erModel)
        };
    }

    public static processPKs(pks: KeyAttribute[]): { columns: string[], primaryKeyConstraint: string } {
        const columns = pks.map(pk => `    ${SQLUtils.parseNameAndType(pk.name).name} ${SQLUtils.parseNameAndType(pk.name).type} NOT NULL`);
        const pkNames = pks.map(pk => SQLUtils.parseNameAndType(pk.name).name);
        const primaryKeyConstraint = pkNames.length > 0 ? `    PRIMARY KEY (${pkNames.join(', ')})` : '';
        return { columns, primaryKeyConstraint };
    }

    public static processAlternativeKeys(altKeys: AlternativeKeyAttribute[], erModel: ErModel): { columns: string[], uniqueConstraints: string[] } {
        const columns: string[] = [];
        const uniqueConstraints: string[] = [];

        for (const ak of altKeys) {
            const isParentNullable = this.isNullable(ak, erModel);
            const nullableStr = isParentNullable ? 'NULL' : 'NOT NULL';
            const childrenNodes = this.getChildrenNodes(ak.id, erModel);

            if (childrenNodes.length > 0) {
                const childColumnNames: string[] = [];
                for (const child of childrenNodes) {
                    const { name, type } = SQLUtils.parseNameAndType(child.name);
                    const isChildOptionalEdge = erModel.optionalAttributeEdges.some(e => e.sourceId === ak.id && e.targetId === child.id);
                    const childNullableStr = (isParentNullable || isChildOptionalEdge) ? 'NULL' : 'NOT NULL';

                    columns.push(`    ${name} ${type} ${childNullableStr}`);
                    childColumnNames.push(name);
                }
                uniqueConstraints.push(`    UNIQUE (${childColumnNames.join(', ')})`);
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
            const childrenNodes = this.getChildrenNodes(attr.id, erModel);

            if (childrenNodes.length > 0) {
                for (const child of childrenNodes) {
                    const { name, type } = SQLUtils.parseNameAndType(child.name);
                    const isChildOptionalEdge = erModel.optionalAttributeEdges.some(e => e.sourceId === attr.id && e.targetId === child.id);
                    const childNullableStr = (isParentNullable || isChildOptionalEdge) ? 'NULL' : 'NOT NULL';
                    columns.push(`    ${name} ${type} ${childNullableStr}`);
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

        const parentPks = this.getPks(parentEntity, erModel).map(pk => SQLUtils.parseNameAndType(pk.name));
        const parentPkColumns = parentPks.map(pk => `    ${pk.name} ${pk.type} NOT NULL`);
        const parentPkNames = parentPks.map(pk => pk.name);

        for (const mvAttr of multiValuedAttrs) {
            const mvRootName = SQLUtils.parseNameAndType(mvAttr.name).name;
            const newTableName = `${parentTableName}_${mvRootName}`;

            const columns: string[] = [...parentPkColumns];
            const currentAttrNames: string[] = [];
            const childrenNodes = this.getChildrenNodes(mvAttr.id, erModel);

            if (childrenNodes.length > 0) {
                for (const child of childrenNodes) {
                    const { name, type } = SQLUtils.parseNameAndType(child.name);
                    columns.push(`    ${name} ${type} NOT NULL`);
                    currentAttrNames.push(name);
                }
            } else {
                const { name, type } = SQLUtils.parseNameAndType(mvAttr.name);
                columns.push(`    ${name} ${type} NOT NULL`);
                currentAttrNames.push(name);
            }

            const allPkNames = [...parentPkNames, ...currentAttrNames];
            const tableLines = [
                ...columns,
                `    PRIMARY KEY (${allPkNames.join(', ')})`
            ];

            if (parentPkNames.length > 0) {
                tableLines.push(`    FOREIGN KEY (${parentPkNames.join(', ')}) REFERENCES ${parentTableName}(${parentPkNames.join(', ')}) ON DELETE CASCADE`);
            }

            createTableStatements.push(`CREATE TABLE ${newTableName} (\n${tableLines.join(',\n')}\n);\n`);
        }
        return createTableStatements;
    }

    private static isNullable(attribute: ErNode, erModel: ErModel): boolean {
        return erModel.optionalAttributeEdges.some(edge => edge.targetId === attribute.id);
    }

    public static getChildrenNodes(attributeId: string, erModel: ErModel): ErNode[] {
        const targetIds = [
            ...erModel.transitions.filter(t => t.sourceId === attributeId).map(t => t.targetId),
            ...erModel.optionalAttributeEdges.filter(o => o.sourceId === attributeId).map(o => o.targetId)
        ];
        return targetIds.map(id => this.findAttributeNode(id, erModel)).filter((n): n is ErNode => n !== undefined);
    }

    private static findAttributeNode(id: string, erModel: ErModel): ErNode | undefined {
        return erModel.attributes.find(a => a.id === id) ||
            erModel.alternativeKeyAttributes.find(a => a.id === id) ||
            erModel.keyAttributes.find(a => a.id === id) ||
            erModel.multiValuedAttributes.find(a => a.id === id);
    }

}