import { GEdge, GLabel, GModelElement, GNode } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { ALTERNATIVE_KEY_ATTRIBUTE_TYPE, ATTRIBUTE_TYPE, DEFAULT_EDGE_TYPE, ENTITY_TYPE, KEY_ATTRIBUTE_TYPE, MULTI_VALUED_ATTRIBUTE_TYPE, OPTIONAL_EDGE_TYPE } from '../validation/utils/validation-constants';

export interface allAttributes {
    pk: GNode[];
    unique: {
        isNullable: boolean, 
        nodes: GNode[] 
    }[];
    simple: GNode[];
    optional: GNode[];
    multiValued: {
        name: string, 
        nodes: GNode[]
    }[];
    derived: GNode[];
}

export interface EntityData {
    node: GNode;
    name: string;
    attributes: allAttributes;
}

type EntityRegistry = Map<string, EntityData>;  // <entityID, EntityData>

@injectable()
export class SQLGenerator {
    private entityRegistry: EntityRegistry = new Map();

    public generate(root: GModelElement): string {
        this.entityRegistry.clear();
        
        // 1.- Collect all entities and their attributes
        const entityNodes = root.children.filter(child => child.type === ENTITY_TYPE) as GNode[];
        for (const node of entityNodes) {
            this.entityRegistry.set(node.id, {
                name: this.cleanNames(node),
                node: node,
                attributes: this.discoverEntittyAttributes(node, root)
            });
        }

        // 2.- Generate SQL for each entity
        let sql = "-- Fecha: " + new Date().toLocaleString() + "\n\n";
        for (const [_, entityData] of this.entityRegistry) {
            sql += this.processEntity(entityData, root);
        }

        return sql;
    }

    private processEntity(entityData: EntityData, root: GModelElement) {
        let columns: string[] = [];
        let compositePK: string[] = [];
        let compositeUnique: string[] = [];
        let tableConstraints: string[] = [];
            
        this.transformPKs(entityData, columns, compositePK);
        this.transformUnique(entityData, columns, compositeUnique, root);
        this.transformSimple(entityData, columns, root);
        this.transformOptionals(entityData, columns);

        if (compositePK.length > 0) tableConstraints.push(`PRIMARY KEY (${compositePK.join(", ")})`) 
        if (compositeUnique.length > 0) tableConstraints.push(...compositeUnique);

        let sql = `CREATE TABLE ${entityData.name} (\n`;
        sql += columns.join(",\n");
        if (tableConstraints.length > 0) sql += ",\n    " + tableConstraints.join(",\n    ");
        sql += "\n);\n\n"

        return sql + this.transformMultivalued(entityData, root);
    }

    private transformPKs(entityData: EntityData, columns: string[], compositePK: string[]) {
        entityData.attributes.pk.flat().forEach(pkNode => {
            const { name, type } = this.getNameAndType(pkNode);
            const isSimplePK = entityData.attributes.pk.length === 1;
            columns.push(`    ${name} ${type} NOT NULL ${isSimplePK ? " PRIMARY KEY" : ""}`);
            if (!isSimplePK) compositePK.push(name);
        });
    }

    private transformUnique(entityData: EntityData, columns: string[], compositeUnique: string[], root: GModelElement) {
        entityData.attributes.unique.forEach(u => {
            const compositeNames: string[] = [];
            const isComp = u.nodes.length > 1;

            u.nodes.forEach(node => {
                const { name, type } = this.getNameAndType(node);
                const nullability = this.getNullability(node, root, u.isNullable);
                columns.push(`    ${name} ${type} ${nullability} ${!isComp ? " UNIQUE" : ""}`);
                compositeNames.push(name);
            });

            if (isComp) compositeUnique.push(`UNIQUE (${compositeNames.join(", ")})`);
        });
    }

    private transformSimple(entityData: EntityData, columns: string[], root: GModelElement) {
        entityData.attributes.simple.flat().forEach(node => {
            const { name, type } = this.getNameAndType(node);
            const nullability = this.getNullability(node, root, false);
            columns.push(`    ${name} ${type} ${nullability}`);
        });
    }

    private transformOptionals(entityData: EntityData, columns: string[]) {
        entityData.attributes.optional.flat().forEach(node => {
            const { name, type } = this.getNameAndType(node);
            columns.push(`    ${name} ${type} NULL`);
        });
    }

    private transformMultivalued(entityData: EntityData, root: GModelElement) {
        return entityData.attributes.multiValued.map(mv => {
            const columns: string[] = [];
            const pkEntity: string[] = [];
            const pkTotal: string[] = [];

            entityData.attributes.pk.flat().forEach(pkNode => {
                const { name, type } = this.getNameAndType(pkNode);
                columns.push(`    ${name} ${type} NOT NULL`);
                pkEntity.push(name);
                pkTotal.push(name);
            });

            mv.nodes.forEach(node => {
                const { name, type } = this.getNameAndType(node);
                const nullability = this.getNullability(node, root, false);
                columns.push(`    ${name} ${type} ${nullability}`);
                pkTotal.push(name);
            });

            let sql = `CREATE TABLE ${entityData.name}_${mv.name} (\n`;
            sql += columns.join(",\n");
            sql += `,\n    PRIMARY KEY (${pkTotal.join(", ")})`;
            sql += `,\n    FOREIGN KEY (${pkEntity.join(", ")}) REFERENCES ${entityData.name}(${pkEntity.join(", ")})`;
            return sql + "\n);\n\n";
        }).join("");
    }

    private discoverEntittyAttributes(entity: GNode, root: GModelElement): allAttributes {
        const attrs: allAttributes = { pk: [], unique: [], simple: [], optional: [], multiValued: [], derived: []};
        const outcomingEdges = this.getEdgesFromSource(entity.id, root);
        for (const edge of outcomingEdges) {
            const attributeNode = this.findById(edge.targetId, root);
            if (attributeNode instanceof GNode) this.categorizeAttribute(attributeNode, edge, attrs, root);
        }
        return attrs;
    }

    private getEdgesFromSource(sourceID: string, root: GModelElement) {
        return root.children.filter(e => e instanceof GEdge && e.sourceId === sourceID && (e.type === DEFAULT_EDGE_TYPE || e.type === OPTIONAL_EDGE_TYPE)) as GEdge[];
    }

    private categorizeAttribute(attribute: GNode, incomingEdge: GEdge, attrs: allAttributes, root: GModelElement) {
        const subEdges = this.getEdgesFromSource(attribute.id, root);
        const subAttributes = subEdges
            .map(edge => this.findById(edge.targetId, root))
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
                const { name } = this.getNameAndType(attribute);
                attrs.multiValued.push({
                    name: name,
                    nodes: targetNodes
                });
                break;
            default: attrs.simple.push(...targetNodes); break;
        }
    }

    private getNullability(node: GNode, root: GModelElement, forceNull: boolean): string {
        if (forceNull) return "NULL";
        const edge = root.children.find(e => e instanceof GEdge && e.targetId === node.id);
        return edge?.type === OPTIONAL_EDGE_TYPE ? "NULL" : "NOT NULL";
    }

    private findById(id: string, root: GModelElement) {
        return root.children.find(element => element.id === id);
    }

    private getNameAndType(node: GNode) {
        return this.splitLabelAttribute(this.cleanNames(node));
    }

    private cleanNames(node: GNode): string {
        const label = node.children.find((c): c is GLabel => c instanceof GLabel);
        const text = label ? label.text : node.id;
        const cleanText = text.replace(/\s+/g, '');
        return cleanText;
    }

    private splitLabelAttribute(label: string) {
        const [name, type] = label.split(':');
        return { name: name.trim(), type: type.trim().toUpperCase() };
    }

}