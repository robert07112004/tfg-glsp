import { GEdge, GLabel, GModelElement, GNode } from '@eclipse-glsp/server';
import { DEFAULT_EDGE_TYPE, OPTIONAL_EDGE_TYPE } from '../validation/utils/validation-constants';

export class SQLUtils {

    static parseNameAndType(rawName: string): { name: string, type: string } {
        const parts = rawName.split(':');
        const name = parts[0].trim().replace(/\s+/g, '_');
        const type = parts.length > 1 ? parts[1].trim().toUpperCase() : 'VARCHAR(255)';
        return { name, type };
    }

    static findById(id: string, root: GModelElement) {
        return root.children.find(element => element.id === id);
    }

    static cleanNames(node: GNode): string {
        const labels = node.children.filter((c): c is GLabel => c instanceof GLabel);

        const nameLabel = labels.find(l =>
            !l.id.includes('_existence_label') &&
            !l.id.includes('_identifying_label') &&
            !l.id.includes('_cardinality_label')
        ) || labels[0];

        const text = nameLabel ? nameLabel.text : node.id;
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

    /**
     * Determines whether an edge description represents the "many" side of a relationship.
     * Handles both letter-based notation ("1..N", "0..M") and specific numeric bounds
     * ("2..30", "(1,5)", "1..2") so that cardinality detection is robust regardless of
     * how the user labeled the weighted edge in the diagram.
     */
    static isMany(description: string): boolean {
        const desc = (description || '').toUpperCase().trim();
        if (desc.includes('N') || desc.includes('M')) return true;
        const nums = desc.match(/\d+/g);
        if (nums && nums.length > 0) {
            const max = parseInt(nums[nums.length - 1], 10);
            return max > 1;
        }
        return false;
    }

    /**
     * Strips the trailing "_disc" convention suffix that users append to discriminator
     * attribute names so the generator can identify them.
     */
    static stripDisc(name: string): string {
        return name.replace(/_disc$/i, '');
    }

    static buildTable(tableName: string, columns: string[], constraints: string[]): string {
        let sql = `CREATE TABLE ${tableName} (\n`;
        sql += columns.join(",\n");
        if (constraints.length > 0) sql += ",\n    " + constraints.join(",\n    ");
        return sql + "\n);\n\n";
    }
}