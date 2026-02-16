import { GModelElement } from "@eclipse-glsp/server";
import { AttributeTransformer } from "./sql-attribute-transformer";
import { Entity, RelationNodes } from "./sql-interfaces";
import { RelationsTransformer } from "./sql-relations-transformer";
import { SQLUtils } from "./sql-utils";

export class EntitiesTransformer {

    static processEntity(entity: Entity, relationNodes: RelationNodes, root: GModelElement): string {
        let sql = `CREATE TABLE ${entity.name} (\n`;
        
        let { columnPKs, restriction: restrictionPks } = AttributeTransformer.processPK(entity.attributes.pk);
        const { columns: uniqueColumns, restriction: restrictionUnique } = AttributeTransformer.processUnique(entity.attributes.unique);
        let simpleAttributes = AttributeTransformer.processSimpleAttributes(entity.attributes.simple);
        const optionalAttributes = AttributeTransformer.processOptionalAttributes(entity.attributes.optional);
        
        const foreignColumns: string[] = [];
        const foreignKeys: string[] = [];
        const relationAttributes: string[] = [];
        const relationRestrictions: string[] = [];
        const relationMultivalued: string[] = [];
        const pks: string[] = [];

        RelationsTransformer.process1NRelation(entity, relationNodes, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);
        RelationsTransformer.processExistenceDependenceRelation("1:N", entity, relationNodes, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);
        const identified = RelationsTransformer.processIdentifyingDependenceRelation("1:N", entity, relationNodes, foreignColumns, pks, relationAttributes, relationRestrictions, foreignKeys, relationMultivalued, root);
        RelationsTransformer.process11Relation(entity, relationNodes, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);
        RelationsTransformer.processExistenceDependenceRelation("1:1", entity, relationNodes, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);

        let tableBody: string[] = [];

        if (identified) {
            simpleAttributes = [];
            AttributeTransformer.transformSimple(entity.node, root).forEach(simple => {
                const {name, type} = SQLUtils.getNameAndType(simple);
                if (name.includes("_disc")) {
                    foreignColumns.push(`    ${name} ${type} NOT NULL`);
                    pks.push(name);
                } else simpleAttributes.push(`    ${name} ${type} NOT NULL`);
            });

            const cleanPKs = [`    PRIMARY KEY (${pks.join(', ')})`]

            tableBody = [
                ...columnPKs,                       // Columnas pks
                ...foreignColumns,
                ...uniqueColumns,                   // Columnas uniques
                ...simpleAttributes,                // Columnas atributos simples
                ...optionalAttributes,              // Columnas atributos opcionales
                ...relationAttributes,              // Columnas atributos pks, unique, simple, opcional de la relacion  
                ...(cleanPKs),                      // PRIMARY KEY (propia entidad)
                ...(restrictionUnique || []),       // UNIQUE (propia entidad)
                ...relationRestrictions,            // solo UNIQUE (relacion) ya que las pks se ponen como unique
                ...foreignKeys                      // FOREIGN KEY ...
            ];
        } else {
            tableBody = [
                ...columnPKs,                       // Columnas pks
                ...uniqueColumns,                   // Columnas uniques
                ...simpleAttributes,                // Columnas atributos simples
                ...optionalAttributes,              // Columnas atributos opcionales
                ...foreignColumns,                  // Columnas de la foreign key
                ...relationAttributes,              // Columnas atributos pks, unique, simple, opcional de la relacion  
                ...(restrictionPks || []),          // PRIMARY KEY (propia entidad)
                ...(restrictionUnique || []),       // UNIQUE (propia entidad)
                ...relationRestrictions,            // solo UNIQUE (relacion) ya que las pks se ponen como unique
                ...foreignKeys                      // FOREIGN KEY ...
            ];
        }
        
        sql += tableBody.join(",\n");
        sql += "\n);\n\n";

        const entityMultivalued = AttributeTransformer.processMultivaluedAttributes(entity.attributes.multiValued, entity.node, root);

        sql += entityMultivalued.join("\n");
        sql += relationMultivalued.join("\n");

        return sql;
    }
    
}