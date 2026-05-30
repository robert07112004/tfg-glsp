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
     *
     * Handles both letter-based notation ("1..N", "0..M") and specific numeric bounds
     * ("2..30", "(1,5)", "1..2") so that cardinality detection is robust regardless of
     * how the user labeled the weighted edge in the diagram.
     *
     * Strategy:
     *   1. If description contains N or M → many.
     *   2. Otherwise extract all numbers and treat the LAST one as the max value.
     *      If max > 1 → many.  e.g. "2..30" → [2,30] → max 30 > 1 → true.
     *                          e.g. "1..1"  → [1,1]  → max 1  = 1 → false.
     */
    static isMany(description: string): boolean {
        const desc = (description || '').toUpperCase().trim();
        // Explicit N or M → many (preserves existing behaviour for "1..N", "0..M" etc.)
        if (desc.includes('N') || desc.includes('M')) return true;
        // Numeric max: take the last integer in the description as the maximum value
        const nums = desc.match(/\d+/g);
        if (nums && nums.length > 0) {
            const max = parseInt(nums[nums.length - 1], 10);
            return max > 1;
        }
        return false;
    }

    /**
     * Strips the trailing "_disc" convention suffix that users append to discriminator
     * attribute names so the generator can identify them.  The suffix must not appear
     * in the generated SQL column names.
     *   "num_sala_disc"  →  "num_sala"
     *   "fecha_disc"     →  "fecha"
     *   "nombre"         →  "nombre"   (unchanged)
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