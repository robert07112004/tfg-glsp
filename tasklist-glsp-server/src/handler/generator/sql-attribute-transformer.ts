import { GEdge, GModelElement, GNode } from '@eclipse-glsp/server';
import { ALTERNATIVE_KEY_ATTRIBUTE_TYPE, ATTRIBUTE_TYPE, ENTITY_TYPE, KEY_ATTRIBUTE_TYPE, MULTI_VALUED_ATTRIBUTE_TYPE, OPTIONAL_EDGE_TYPE, RELATION_TYPE } from '../validation/utils/validation-constants';
import { AllAttributes, Multivalued } from './sql-interfaces';
import { RelationsTransformer } from './sql-relations-transformer';
import { SQLUtils } from './sql-utils';

export class AttributeTransformer {

    static processPK(pks: GNode[]): { columnPKs: string[], restriction: string[] } {
        let columnPKs: string[] = [];
        let restriction: string[] = [];

        if (pks.length === 1) {
            const {name, type} = SQLUtils.getNameAndType(pks[0]);
            columnPKs = [`    ${name} ${type} NOT NULL PRIMARY KEY`];
        } else if (pks.length > 1) {
            const names: string[] = []
            for (const pk of pks) {
                const {name, type} = SQLUtils.getNameAndType(pk);
                columnPKs.push(`    ${name} ${type} NOT NULL`);
                names.push(name);
            }
            restriction = [`    PRIMARY KEY (${names.join(', ')})`];
        }
        return { columnPKs, restriction };
    }

    static processUnique(uniques: { isNullable: boolean, nodes: GNode[] }[]): { columns: string[], restriction: string[] } {
        let columns: string[] = [];
        let restriction: string[] = [];
        for (const unique of uniques) {
            if (unique.nodes.length === 1) {
                const {name, type} = SQLUtils.getNameAndType(unique.nodes[0]);
                const nullability = unique.isNullable ? "NULL" : "NOT NULL";
                columns.push(`    ${name} ${type} ${nullability} UNIQUE`);
            } else if (unique.nodes.length > 1) {
                const names: string[] = [];
                for (const node of unique.nodes) {
                    const { name, type } = SQLUtils.getNameAndType(node);
                    const nullability = unique.isNullable ? "NULL" : "NOT NULL";
                    columns.push(`    ${name} ${type} ${nullability}`);
                    names.push(name);
                }
                restriction.push(`    UNIQUE (${names.join(', ')})`);
            }
        }
        return { columns, restriction };
    }

    static processSimpleAttributes(attributes: GNode[]): string[] {
        let columns: string[] = [];
        for (const attribute of attributes) {
            const {name, type} = SQLUtils.getNameAndType(attribute);
            columns.push(`    ${name} ${type} NOT NULL`);
        }
        return columns;
    }

    static processOptionalAttributes(optionalAttributes: GNode[]): string[] {
        let columns: string[] = [];
        for (const optionalAttribute of optionalAttributes) {
            const {name, type} = SQLUtils.getNameAndType(optionalAttribute);
            columns.push(`    ${name} ${type} NULL`);
        }
        return columns;
    }

    static processMultivaluedAttributes(multivaluedAttributes: Multivalued[], parentNode: GNode, root: GModelElement): string[] {
        let resultString: string[] = [];
        if (!multivaluedAttributes) return [];
        for (const multivalued of multivaluedAttributes) {
            let tableLines: string[] = [];
            let pks: string[] = [];
            let tableName = `${multivalued.parentName}_${multivalued.name}`;
            let sql = `CREATE TABLE ${tableName} (\n`;

            multivalued.parentPKs.forEach(pkData => {
                console.log(pkData.colName);
                const {name: _, type: type} = SQLUtils.getNameAndType(pkData.node);
                tableLines.push(`    ${pkData.colName} ${type} NOT NULL`);
                pks.push(pkData.colName);
                console.log(tableLines);
                console.log(pks);
            });

            multivalued.selfNode.forEach(mv => {
                const { name, type } = SQLUtils.getNameAndType(mv);
                tableLines.push(`    ${name} ${type} NOT NULL`);
                pks.push(name);
            });

            tableLines.push(`    PRIMARY KEY (${pks.join(', ')})`);

            console.log(multivalued);
            multivalued.parentPKs.forEach(pkData => {
                if (RelationsTransformer.isReflexive(parentNode, root)) {
                    let newColName = pkData.colName;
                    if (pkData.colName[pkData.colName.length - 1].includes("1") || pkData.colName[pkData.colName.length - 1].includes("2")) newColName = pkData.colName.slice(0, -2); 
                    tableLines.push(`    FOREIGN KEY (${pkData.colName}) REFERENCES ${pkData.tableName}(${newColName}) ON DELETE CASCADE`);
                } else tableLines.push(`    FOREIGN KEY (${pkData.colName}) REFERENCES ${pkData.tableName}(${pkData.colName}) ON DELETE CASCADE`);
            });

            sql += tableLines.join(",\n");
            sql += "\n);\n\n";
            
            resultString.push(sql);
        }
        
        return resultString;
    }

    static getAllAttributes(entity: GNode, root: GModelElement): AllAttributes {
        const processedIds = new Set<string>();

        const pk = this.transformPKs(entity, root);
        pk.forEach(n => processedIds.add(n.id));

        const unique = this.transformUnique(entity, root);
        unique.forEach(group => {
            group.nodes.forEach(n => processedIds.add(n.id));
        });

        const simple = this.transformSimple(entity, root)
            .filter(n => !processedIds.has(n.id));
        simple.forEach(n => processedIds.add(n.id));

        const optional = this.transformOptionals(entity, root)
            .filter(n => !processedIds.has(n.id));

        return { 
            pk, 
            unique, 
            simple, 
            optional, 
            multiValued: this.transformMultivalued(entity, root) 
        };
    }

    static transformPKs(entity: GNode, root: GModelElement): GNode[] {
        const pks: GNode[] = [];
        const edges = root.children.filter(child => child instanceof GEdge && child.sourceId === entity.id) as GEdge[];
        for (const edge of edges) {
            const node = SQLUtils.findById(edge.targetId, root) as GNode;
            if (node.type === KEY_ATTRIBUTE_TYPE) {
                const compositePKEdges: GEdge[] = root.children.filter(child => child instanceof GEdge && child.sourceId === node.id) as GEdge[];
                if (compositePKEdges.length !== 0) {
                    for (const compositePKEdge of compositePKEdges) {
                        const nodeCompositePK: GNode = SQLUtils.findById(compositePKEdge.targetId, root) as GNode;
                        pks.push(nodeCompositePK);
                    }
                } else pks.push(node);
            }
        }
        return pks;
    }

    static transformUnique(entity: GNode, root: GModelElement): { isNullable: boolean, nodes: GNode[] }[] {
        const uniques: { isNullable: boolean, nodes: GNode[] }[] = [];
        const edges = root.children.filter(child => child instanceof GEdge && child.sourceId === entity.id) as GEdge[];
        for (const edge of edges) {
            const node = SQLUtils.findById(edge.targetId, root) as GNode;
            if (node.type === ALTERNATIVE_KEY_ATTRIBUTE_TYPE) {
                const compositeUniques: GNode[] = [];
                const isOptional: boolean = edge.type === OPTIONAL_EDGE_TYPE;
                const compositeUniquesEdges: GEdge[] = root.children.filter(child => child instanceof GEdge && child.sourceId === node.id) as GEdge[];
                if (compositeUniquesEdges.length !== 0) {
                    for (const compositeUniqueEdge of compositeUniquesEdges) {
                        const nodeComposite: GNode = SQLUtils.findById(compositeUniqueEdge.targetId, root) as GNode;
                        compositeUniques.push(nodeComposite);
                    }
                    uniques.push({ isNullable: isOptional, nodes: compositeUniques });
                } else uniques.push({ isNullable: isOptional, nodes: [node] });
            }
        }
        return uniques;
    }

    static transformSimple(entity: GNode, root: GModelElement): GNode[] {
        const attributes: GNode[] = [];
        const edges: GEdge[] = root.children.filter(child => child instanceof GEdge && child.sourceId === entity.id && child.type !== OPTIONAL_EDGE_TYPE) as GEdge[];
        for (const edge of edges) {
            const node: GNode = SQLUtils.findById(edge.targetId, root) as GNode;
            if (node.type === ATTRIBUTE_TYPE) {
                const compositeAttributeEdges: GEdge[] = root.children.filter(child => child instanceof GEdge && child.sourceId === node.id) as GEdge[];
                if (compositeAttributeEdges.length !== 0) {
                    for (const compositeAttributeEdge of compositeAttributeEdges) {
                        const compositeAttribute: GNode = SQLUtils.findById(compositeAttributeEdge.targetId, root) as GNode;
                        attributes.push(compositeAttribute);
                    }
                } else attributes.push(node);
            } 
        }
        return attributes;
    }

    static transformOptionals(entity: GNode, root: GModelElement): GNode[] {
        const optionalAttributes: GNode[] = [];
        const edges: GEdge[] = root.children.filter(child => child instanceof GEdge && child.sourceId === entity.id && child.type === OPTIONAL_EDGE_TYPE) as GEdge[];
        for (const edge of edges) {
            const node: GNode = SQLUtils.findById(edge.targetId, root) as GNode;
            const compositeAttributeEdges: GEdge[] = root.children.filter(child => child instanceof GEdge && child.sourceId === node.id) as GEdge[];
            if (compositeAttributeEdges.length !== 0) {
                for (const compositeAttributeEdge of compositeAttributeEdges) {
                    const compositeAttribute: GNode = SQLUtils.findById(compositeAttributeEdge.targetId, root) as GNode;
                    optionalAttributes.push(compositeAttribute);
                }
            } else optionalAttributes.push(node);
        }
        return optionalAttributes;
    }

    static transformMultivalued(node: GNode, root: GModelElement): Multivalued[] {
        const multivalued: Multivalued[] = [];
        const edges = root.children.filter(child => child instanceof GEdge && child.sourceId === node.id) as GEdge[];
        let parentPKs: { node: GNode, tableName: string, colName: string }[] = [];

        if (node.type === ENTITY_TYPE) parentPKs = AttributeTransformer.transformPKs(node, root).map(pk => ({ node: pk, tableName: SQLUtils.cleanNames(node), colName: SQLUtils.getNameAndType(pk).name }));
        else if (node.type === RELATION_TYPE) {
            const cardinality = SQLUtils.getCardinality(node);
            if (cardinality.includes("N:M")) {
                const relPKs = AttributeTransformer.transformPKs(node, root);
                if (relPKs.length > 0) {
                    parentPKs = relPKs.map(pk => ({ node: pk, tableName: SQLUtils.cleanNames(node), colName: SQLUtils.getNameAndType(pk).name }));
                } else {
                    const connectedEdges = root.children.filter(child => child instanceof GEdge && child.targetId === node.id) as GEdge[];
                    for (const edge of connectedEdges) {
                        const entity = SQLUtils.findById(edge.sourceId, root) as GNode;
                        if (entity && entity.type === ENTITY_TYPE) {
                            const entityPKs = AttributeTransformer.transformPKs(entity, root).map(pk => ({ node: pk, tableName: SQLUtils.cleanNames(entity), colName: SQLUtils.getNameAndType(pk).name }));
                            parentPKs = [...parentPKs, ...entityPKs];
                        }
                    }
                }
            } else if (cardinality.includes("1:N")) {
                const edgeN = root.children.find(child => child instanceof GEdge && child.targetId === node.id && SQLUtils.getCardinality(child).includes("N")) as GEdge;
                const entity = SQLUtils.findById(edgeN.sourceId, root) as GNode;
                parentPKs = AttributeTransformer.transformPKs(entity, root).map(pk => ({ node: pk, tableName: SQLUtils.cleanNames(entity), colName: SQLUtils.getNameAndType(pk).name} ));
            } else if (cardinality.includes("1:1")) {
                const connectedEdges: GEdge[] = root.children.filter(child => child instanceof GEdge && child.targetId === node.id) as GEdge[];
                if (connectedEdges.length === 2) {
                    const leftEdge = connectedEdges[0];
                    const rightEdge = connectedEdges[1];
                    
                    const leftEntity = SQLUtils.findById(leftEdge.sourceId, root) as GNode;
                    const rightEntity = SQLUtils.findById(rightEdge.sourceId, root) as GNode;

                    const leftIsOptional = leftEdge.type === OPTIONAL_EDGE_TYPE;
                    const rightIsOptional = rightEdge.type === OPTIONAL_EDGE_TYPE;

                    let selectedEntity: GNode;

                    if (!leftIsOptional && rightIsOptional) selectedEntity = leftEntity;
                    else if (leftIsOptional && !rightIsOptional) selectedEntity = rightEntity;
                    else selectedEntity = leftEntity.id < rightEntity.id ? leftEntity : rightEntity;

                    parentPKs = AttributeTransformer.transformPKs(selectedEntity, root).map(pk => ({ node: pk, tableName: SQLUtils.cleanNames(selectedEntity), colName: SQLUtils.getNameAndType(pk).name }));
                }
            }
        }

        for (const edge of edges) {
            const mvNode = SQLUtils.findById(edge.targetId, root) as GNode;    
            if (mvNode && mvNode.type === MULTI_VALUED_ATTRIBUTE_TYPE) {
                const selfNodes = this.getCompositeNodes(mvNode, root);
                multivalued.push({
                    name: SQLUtils.getNameAndType(mvNode).name,
                    parentName: SQLUtils.cleanNames(node),
                    parentPKs: parentPKs,
                    selfNode: selfNodes
                });
            }
        }

        return multivalued;
    }

    private static getCompositeNodes(attrNode: GNode, root: GModelElement): GNode[] {
        const childEdges = root.children.filter(c => c instanceof GEdge && c.sourceId === attrNode.id) as GEdge[];
        if (childEdges.length > 0) return childEdges.map(edge => SQLUtils.findById(edge.targetId, root) as GNode);
        return [attrNode];
    }

}