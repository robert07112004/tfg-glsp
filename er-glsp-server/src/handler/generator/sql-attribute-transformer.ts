import { AlternativeKeyAttribute, Attribute, ErModel, ErNode, KeyAttribute, MultiValuedAttribute } from "../../model/er-model";
import { AllAttributes, FullPK } from "./sql-interfaces";
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

    public static getDiscriminator(node: ErNode, erModel: ErModel): Attribute[] {
        const attributes = erModel.attributes || [];
        const transitions = erModel.transitions || [];

        return attributes.filter(attr => {
            const { name } = SQLUtils.parseNameAndType(attr.name);
            if (!name.toLowerCase().endsWith('_disc')) return false;
            return transitions.some(t => t.sourceId === node.id && t.targetId === attr.id);
        });
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
        const columns = pks.map(pk => {
            const { name, type } = SQLUtils.parseNameAndType(pk.name);
            return `    ${name} ${type} NOT NULL`;
        });
        const pkNames = pks.map(pk => SQLUtils.parseNameAndType(pk.name).name);
        const primaryKeyConstraint = pkNames.length > 0 ? `    PRIMARY KEY (${pkNames.join(', ')})` : '';
        return { columns, primaryKeyConstraint };
    }

    public static processAlternativeKeys(altKeys: AlternativeKeyAttribute[], erModel: ErModel): { columns: string[], uniqueConstraints: string[] } {
        const columns: string[] = [];
        const uniqueConstraints: string[] = [];

        for (const ak of altKeys) {
            const isParentNullable = this.isNullable(ak, erModel);
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
                const nullableStr = isParentNullable ? 'NULL' : 'NOT NULL';
                columns.push(`    ${name} ${type} UNIQUE ${nullableStr}`);
            }
        }
        return { columns, uniqueConstraints };
    }

    public static processAttributes(attributes: Attribute[], erModel: ErModel, forceNull: boolean = false): string[] {
        const columns: string[] = [];
        for (const attr of attributes) {
            const isParentNullable = forceNull || this.isNullable(attr, erModel);
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
                const nullableStr = isParentNullable ? 'NULL' : 'NOT NULL';
                columns.push(`    ${name} ${type} ${nullableStr}`);
            }
        }
        return columns;
    }

    public static processMultiValuedAttributes(multiValuedAttrs: MultiValuedAttribute[], parentNode: ErNode, erModel: ErModel, fullPKs?: FullPK[]): string[] {
        const createTableStatements: string[] = [];
        const parentTableName = SQLUtils.parseNameAndType(parentNode.name).name;

        const pkData = fullPKs
            ? fullPKs.map(pk => ({ name: pk.colNameInThisTable, type: pk.type }))
            : this.getPks(parentNode, erModel).map(pk => SQLUtils.parseNameAndType(pk.name));

        const parentPkColumns = pkData.map(pk => `    ${pk.name} ${pk.type} NOT NULL`);
        const parentPkNames = pkData.map(pk => pk.name);

        for (const mvAttr of multiValuedAttrs) {
            const mvRootName = SQLUtils.parseNameAndType(mvAttr.name).name;
            const newTableName = `${parentTableName}_${mvRootName}`;

            const columns: string[] = [...parentPkColumns];
            const currentAttrNames: string[] = [];
            const childrenNodes = this.getChildrenNodes(mvAttr.id, erModel);

            const nodesToProcess = childrenNodes.length > 0 ? childrenNodes : [mvAttr];
            for (const node of nodesToProcess) {
                const { name, type } = SQLUtils.parseNameAndType(node.name);
                const isOptional = erModel.optionalAttributeEdges.some(e => e.sourceId === mvAttr.id && e.targetId === node.id);
                columns.push(`    ${name} ${type} ${isOptional ? 'NULL' : 'NOT NULL'}`);
                if (!isOptional) currentAttrNames.push(name);
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