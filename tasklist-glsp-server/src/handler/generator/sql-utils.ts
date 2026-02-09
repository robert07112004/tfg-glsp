import { GEdge, GLabel, GModelElement, GNode } from '@eclipse-glsp/server';
import { DEFAULT_EDGE_TYPE, OPTIONAL_EDGE_TYPE } from '../validation/utils/validation-constants';

export class SQLUtils {
    static findById(id: string, root: GModelElement) {
        return root.children.find(element => element.id === id);
    }

    static cleanNames(node: GNode): string {
        const label = node.children.find((c): c is GLabel => c instanceof GLabel);
        const text = label ? label.text : node.id;
        return text.replace(/\s+/g, '');
    }

    static splitLabelAttribute(label: string) {
        const [name, type] = label.split(':');
        return { name: name.trim(), type: type.trim().toUpperCase() };
    }

    static getNullability(node: GNode, root: GModelElement, forceNull: boolean): string {
        if (forceNull) return "NULL";
        const edge = root.children.find(e => e instanceof GEdge && e.targetId === node.id);
        return edge?.type === OPTIONAL_EDGE_TYPE ? "NULL" : "NOT NULL";
    }

    static getNameAndType(node: GNode) {
        return this.splitLabelAttribute(this.cleanNames(node));
    }

    static getCardinality(node: GNode | GEdge): string {
        const label = node.children.find((c): c is GLabel => c instanceof GLabel && (c.type.includes('cardinality') || c.type.includes('weighted')));
        return label ? (label as GLabel).text : '';
    }

    static getEdgesFromSource(sourceID: string, root: GModelElement) {
        return root.children.filter(e => e instanceof GEdge && e.sourceId === sourceID && (e.type === DEFAULT_EDGE_TYPE || e.type === OPTIONAL_EDGE_TYPE)) as GEdge[];
    }

    static buildTable(tableName: string, columns: string[], constraints: string[]): string {
        let sql = `CREATE TABLE ${tableName} (\n`;
        sql += columns.join(",\n");
        if (constraints.length > 0) sql += ",\n    " + constraints.join(",\n    ");
        return sql + "\n);\n\n";
    }
}