import { GModelElement } from "@eclipse-glsp/server";
import { AttributeTransformer } from "./sql-attribute-transformer";
import { Entity } from "./sql-interfaces";

export class EntitiesTransformer {
    
    static processEntity(entity: Entity, root: GModelElement): string {
        let sql = `CREATE TABLE ${entity.name} (\n`;
        
        const { columnPKs, restriction: restrictionPks } = AttributeTransformer.processPK(entity.attributes.pk);
        const { columns: uniqueColumns, restriction: restrictionUnique } = AttributeTransformer.processUnique(entity.attributes.unique);
        const simpleAttributes = AttributeTransformer.processSimpleAttributes(entity.attributes.simple);
        const optionalAttributes = AttributeTransformer.processOptionalAttributes(entity.attributes.optional);
        
        const tableBody: string[] = [
            ...columnPKs,
            ...uniqueColumns,
            ...simpleAttributes,
            ...optionalAttributes,
            ...(restrictionPks || []),
            ...(restrictionUnique || [])
        ];

        sql += tableBody.join(",\n");
        sql += "\n);\n\n";

        const multivalued = AttributeTransformer.processMultivaluedAttributes(entity.attributes.multiValued, entity.node, root);
        sql += multivalued.join("\n");

        return sql;
    }
    
}