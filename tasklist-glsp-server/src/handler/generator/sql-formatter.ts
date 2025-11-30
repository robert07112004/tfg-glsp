import { GNode } from "@eclipse-glsp/server";
import { ALTERNATIVE_KEY_ATTRIBUTE_TYPE, ATTRIBUTE_TYPE, DERIVED_ATTRIBUTE_TYPE, KEY_ATTRIBUTE_TYPE, MULTI_VALUED_ATTRIBUTE_TYPE } from "../validation/utils/validation-constants";
import { ModelUtils } from "./model-utils";

export class SQLFormatter {
    
    static getSafeName(node: GNode): string {
        const rawName = ModelUtils.getNameFromNode(node);
        return rawName ? rawName.replace(/\s+/g, '_') : node.id;
    }

    static splitLabelAttribute(label: string) {
        const [name, type] = label.split(':');
        const typeAttribute = type.replace('_', '').toUpperCase();
        return {
            name: name,
            type: typeAttribute
        }
    }

    static sortAttributes(attributes: GNode[]): GNode[] {
        const priorities: Record<string, number> = {
            [KEY_ATTRIBUTE_TYPE]: 1,
            [ALTERNATIVE_KEY_ATTRIBUTE_TYPE]: 2,
            [ATTRIBUTE_TYPE]: 3,
            [DERIVED_ATTRIBUTE_TYPE]: 4,
            [MULTI_VALUED_ATTRIBUTE_TYPE]: 5
        };
        return attributes.sort((a, b) => (priorities[a.type] ?? 99) - (priorities[b.type] ?? 99));
    }

    static buildCreateTable(tableName: string, columns: string[], foreignKeys: string[] = [], primaryKeys: string[] = []): string {
        let sql = `CREATE TABLE ${tableName} (\n`;
        const allLines = [...columns];
        
        if (primaryKeys.length > 0) {
            allLines.push(`    PRIMARY KEY (${primaryKeys.join(", ")})`);
        }
        
        foreignKeys.forEach(fk => allLines.push(fk));
        
        sql += allLines.join(",\n");
        sql += "\n);\n";
        return sql;
    }

}