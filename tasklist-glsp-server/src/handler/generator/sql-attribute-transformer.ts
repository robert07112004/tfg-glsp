import { GEdge, GModelElement, GNode } from '@eclipse-glsp/server';
import { ALTERNATIVE_KEY_ATTRIBUTE_TYPE, ATTRIBUTE_TYPE, KEY_ATTRIBUTE_TYPE, MULTI_VALUED_ATTRIBUTE_TYPE, OPTIONAL_EDGE_TYPE } from '../validation/utils/validation-constants';
import { allAttributes, NodeData } from './sql-interfaces';
import { SQLUtils } from './sql-utils';

export class AttributeTransformer {
    static discoverNodeAttributes(node: GNode, root: GModelElement): allAttributes {
        const attrs: allAttributes = { pk: [], unique: [], simple: [], optional: [], multiValued: [], derived: []};
        const outcomingEdges = SQLUtils.getEdgesFromSource(node.id, root);
        for (const edge of outcomingEdges) {
            const attributeNode = SQLUtils.findById(edge.targetId, root);
            if (attributeNode instanceof GNode) this.categorizeAttribute(attributeNode, edge, attrs, root);
        }
        return attrs;
    }

    static categorizeAttribute(attribute: GNode, incomingEdge: GEdge, attrs: allAttributes, root: GModelElement) {
        const subEdges = SQLUtils.getEdgesFromSource(attribute.id, root);
        const subAttributes = subEdges
            .map(edge => SQLUtils.findById(edge.targetId, root))
            .filter((node): node is GNode => node instanceof GNode);

        const isComposite = subAttributes.length >= 2;
        const targetNodes = isComposite ? subAttributes : [attribute];
        const isOptionalEdge = incomingEdge.type === OPTIONAL_EDGE_TYPE;

        if (isOptionalEdge && attribute.type === ATTRIBUTE_TYPE) {
            attrs.optional.push(...targetNodes);
            return;
        }

        switch (attribute.type) {
            case KEY_ATTRIBUTE_TYPE: attrs.pk.push(...targetNodes); break;
            case ALTERNATIVE_KEY_ATTRIBUTE_TYPE:
                attrs.unique.push({
                    isNullable: isOptionalEdge,
                    nodes: targetNodes
                });
                break;
            case MULTI_VALUED_ATTRIBUTE_TYPE:
                const { name } = SQLUtils.getNameAndType(attribute);
                attrs.multiValued.push({
                    name: name,
                    nodes: targetNodes
                });
                break;
            default: attrs.simple.push(...targetNodes); break;
        }
    }
    
    static transformPKs(entityData: NodeData, columns: string[], compositePK: string[]) {
        entityData.attributes.pk.flat().forEach(pkNode => {
            const { name, type } = SQLUtils.getNameAndType(pkNode);
            const isSimplePK = entityData.attributes.pk.length === 1;
            columns.push(`    ${name} ${type} NOT NULL ${isSimplePK ? "PRIMARY KEY" : ""}`);
            if (!isSimplePK) compositePK.push(name);
        });
    }

    static processMultivalued(parentTableName: string, parentPKNodes: GNode[], mvAttr: { name: string, nodes: GNode[] }, root: GModelElement): string {
        const columns: string[] = [];
        const tableConstraints: string[] = [];
        const fkColumns: string[] = [];
        const attrColumns: string[] = [];

        parentPKNodes.forEach(pk => {
            const { name, type } = SQLUtils.getNameAndType(pk);
            const columnName = `${parentTableName}_${name}`; 
            columns.push(`    ${columnName} ${type} NOT NULL`);
            fkColumns.push(columnName);
        });

        mvAttr.nodes.forEach(node => {
            const { name, type } = SQLUtils.getNameAndType(node);
            columns.push(`    ${name} ${type} NOT NULL`);
            attrColumns.push(name);
        });

        tableConstraints.push(`PRIMARY KEY (${[...fkColumns, ...attrColumns].join(", ")})`);
        const parentPKNames = parentPKNodes.map(pk => SQLUtils.getNameAndType(pk).name);
        tableConstraints.push(`FOREIGN KEY (${fkColumns.join(", ")}) REFERENCES ${parentTableName}(${parentPKNames.join(", ")}) ON DELETE CASCADE`);

        return SQLUtils.buildTable(`${parentTableName}_${mvAttr.name}`, columns, tableConstraints);
    }

    static transformUnique(entityData: NodeData, columns: string[], compositeUnique: string[], root: GModelElement) {
        entityData.attributes.unique.forEach(u => {
            const compositeNames: string[] = [];
            const isComp = u.nodes.length > 1;

            u.nodes.forEach(node => {
                const { name, type } = SQLUtils.getNameAndType(node);
                const nullability = SQLUtils.getNullability(node, root, u.isNullable);
                columns.push(`    ${name} ${type} ${nullability} ${!isComp ? "UNIQUE" : ""}`);
                compositeNames.push(name);
            });

            if (isComp) compositeUnique.push(`UNIQUE (${compositeNames.join(", ")})`);
        });
    }

    static transformSimple(entityData: NodeData, columns: string[], root: GModelElement) {
        entityData.attributes.simple.flat().forEach(node => {
            const { name, type } = SQLUtils.getNameAndType(node);
            const nullability = SQLUtils.getNullability(node, root, false);
            columns.push(`    ${name} ${type} ${nullability}`);
        });
    }

    static transformOptionals(entityData: NodeData, columns: string[]) {
        entityData.attributes.optional.flat().forEach(node => {
            const { name, type } = SQLUtils.getNameAndType(node);
            columns.push(`    ${name} ${type} NULL`);
        });
    }

}