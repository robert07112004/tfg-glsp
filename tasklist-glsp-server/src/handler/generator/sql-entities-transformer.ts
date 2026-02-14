import { GModelElement } from "@eclipse-glsp/server";
import { AttributeTransformer } from "./sql-attribute-transformer";
import { Entity, RelationNodes } from "./sql-interfaces";
import { RelationsTransformer } from "./sql-relations-transformer";

export class EntitiesTransformer {
    
    static processEntity(entity: Entity, relationNodes: RelationNodes, root: GModelElement): string {
        let sql = `CREATE TABLE ${entity.name} (\n`;
        
        const { columnPKs, restriction: restrictionPks } = AttributeTransformer.processPK(entity.attributes.pk);
        const { columns: uniqueColumns, restriction: restrictionUnique } = AttributeTransformer.processUnique(entity.attributes.unique);
        const simpleAttributes = AttributeTransformer.processSimpleAttributes(entity.attributes.simple);
        const optionalAttributes = AttributeTransformer.processOptionalAttributes(entity.attributes.optional);
        
        const foreignColumns: string[] = [];
        const foreignKeys: string[] = [];
        const relationAttributes: string[] = [];
        const relationRestrictions: string[] = [];
        const relationMultivalued: string[] = [];

        RelationsTransformer.process1NRelation(entity, relationNodes, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);
        RelationsTransformer.processExistenceDependenceRelation("1:N", entity, relationNodes, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);
        RelationsTransformer.process11Relation(entity, relationNodes, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);
        RelationsTransformer.processExistenceDependenceRelation("1:1", entity, relationNodes, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);

        const tableBody: string[] = [
            ...columnPKs,
            ...uniqueColumns,
            ...simpleAttributes,
            ...optionalAttributes,
            ...foreignColumns,      
            ...relationAttributes,  
            ...(restrictionPks || []),
            ...(restrictionUnique || []),
            ...relationRestrictions,
            ...foreignKeys          
        ];

        sql += tableBody.join(",\n");
        sql += "\n);\n\n";

        const entityMultivalued = AttributeTransformer.processMultivaluedAttributes(entity.attributes.multiValued, entity.node, root);

        sql += entityMultivalued.join("\n");
        sql += relationMultivalued.join("\n");

        return sql;
    }
    
}