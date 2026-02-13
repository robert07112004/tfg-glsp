import { GEdge, GModelElement, GNode } from "@eclipse-glsp/server";
import { AttributeTransformer } from "./sql-attribute-transformer";
import { Relation } from "./sql-interfaces";
import { SQLUtils } from "./sql-utils";

export class RelationsTransformer {

    /*static processRelationNM(relation: Relation, root: GModelElement): string {
        let sql = `CREATE TABLE ${relation.name} (\n`;
        let tableLines: string[] = [];
        let pkColumns: string[] = [];
        let fkColumns: string[] = [];
        // Esta lista la usaremos para los multievaluados
        let parentPkInfo: { node: GNode, tableName: string, colName: string }[] = [];

        const { columnPKs, restriction: relPkRest } = AttributeTransformer.processPK(relation.attributes.pk);
        const { columns: uniqueColumns, restriction: relUniqueRest } = AttributeTransformer.processUnique(relation.attributes.unique);

        // 1. Columnas base de la relación
        tableLines.push(...columnPKs, ...uniqueColumns);

        // 2. Procesar Entidades Conectadas
        relation.connectedEntities.forEach((conn, index) => {
            const entityName = SQLUtils.cleanNames(conn.entity);
            const entityPkNodes = AttributeTransformer.transformPKs(conn.entity, root);

            entityPkNodes.forEach(pkNode => {
                const { name, type } = SQLUtils.getNameAndType(pkNode);
                
                // SI ES REFLEXIVA, cambiamos el nombre de la columna para evitar colisión
                const colName = relation.isReflexive ? `${name}_${index + 1}` : name;

                tableLines.push(`    ${colName} ${type} NOT NULL`);
                
                // Si el rombo no tiene PK, estas columnas forman la PK compuesta
                if (columnPKs.length === 0) pkColumns.push(colName);

                fkColumns.push(`    FOREIGN KEY (${colName}) REFERENCES ${entityName}(${name})`);
                
                // Guardamos info para que el multievaluado sepa cómo se llama su "padre"
                parentPkInfo.push({ node: pkNode, tableName: entityName, colName: colName });
            });
        });

        // 3. Atributos simples y opcionales
        tableLines.push(...AttributeTransformer.processSimpleAttributes(relation.attributes.simple));
        tableLines.push(...AttributeTransformer.processOptionalAttributes(relation.attributes.optional));

        // 4. Restricciones de PK y UNIQUE
        if (columnPKs.length === 0 && pkColumns.length > 0) {
            tableLines.push(`    PRIMARY KEY (${pkColumns.join(', ')})`);
        } else if (relPkRest.length > 0) {
            tableLines.push(...relPkRest);
        }
        
        if (relUniqueRest.length > 0) tableLines.push(...relUniqueRest);
        tableLines.push(...fkColumns);

        sql += tableLines.join(",\n");
        sql += "\n);\n\n";

        // 5. Multievaluados (Pasamos la info con los nombres de columna ya corregidos)
        // Nota: Necesitarás ajustar processMultivaluedAttributes para aceptar 'colName'
        const multivalued = AttributeTransformer.processMultivaluedAttributes(relation.attributes.multiValued);
        sql += multivalued.join("\n");

        return sql;
    }*/

    static processRelationNM(relation: Relation, root: GModelElement): string {
        let sql = `CREATE TABLE ${relation.name} (\n`;
        let tableLines: string[] = [];
        let pkColumns: string[] = [];
        let fkColumns: string[] = [];
        
        const colNameMapping: { node: GNode, tableName: string, colName: string }[] = [];
        const { columnPKs, restriction: relPkRest } = AttributeTransformer.processPK(relation.attributes.pk);
        const { columns: uniqueColumns, restriction: relUniqueRest } = AttributeTransformer.processUnique(relation.attributes.unique);

        if (relation.attributes.pk.length > 0) {
            relation.attributes.pk.forEach(pkNode => {
                const { name } = SQLUtils.getNameAndType(pkNode);
                colNameMapping.push({ node: pkNode, tableName: relation.name, colName: name });
            });
        }

        if (columnPKs.length > 0) tableLines.push(...columnPKs);
        const isReflexive = this.isReflexive(relation.node, root);
        
        relation.connectedEntities.forEach((conn, index) => {
            const entityName = SQLUtils.cleanNames(conn.entity);
            const entityPkNodes = AttributeTransformer.transformPKs(conn.entity, root);

            entityPkNodes.forEach(pkNode => {
                const { name, type } = SQLUtils.getNameAndType(pkNode);
                const colName = isReflexive ? `${name}_${index + 1}` : name;
                tableLines.push(`    ${colName} ${type} NOT NULL`);
                if (relation.attributes.pk.length === 0) {
                    pkColumns.push(colName);
                    colNameMapping.push({ node: pkNode, tableName: SQLUtils.cleanNames(conn.entity), colName: colName });
                }
                fkColumns.push(`    FOREIGN KEY (${colName}) REFERENCES ${entityName}(${name})`);
            });
        });

        tableLines.push(...uniqueColumns, ...AttributeTransformer.processSimpleAttributes(relation.attributes.simple), ...AttributeTransformer.processOptionalAttributes(relation.attributes.optional));
        
        if (relation.attributes.pk.length === 0 && pkColumns.length > 0) tableLines.push(`    PRIMARY KEY (${pkColumns.join(', ')})`);
        else if (relPkRest.length > 0) tableLines.push(...relPkRest);
        
        if (relUniqueRest.length > 0) tableLines.push(...relUniqueRest);
        tableLines.push(...fkColumns);

        sql += tableLines.join(",\n") + "\n);\n\n";

        relation.attributes.multiValued.forEach(mv => {
            mv.parentPKs = colNameMapping;
            mv.parentName = relation.name; 
        });

        const multivalued = AttributeTransformer.processMultivaluedAttributes(relation.attributes.multiValued, relation.node, root);
        return sql + multivalued.join("\n");
    }
       
    static isReflexive(relation: GNode, root: GModelElement): boolean {
        const uniqueEntities = new Set<string>();
        const edges = root.children.filter(child => child instanceof GEdge && child.targetId === relation.id) as GEdge[];
        for (const edge of edges) uniqueEntities.add(edge.sourceId);
        return uniqueEntities.size === 1 && edges.length > 1;
    }

    static getConnectedEntities(relation: GNode, root: GModelElement): { cardinalityText: string, entity: GNode }[] {
        const connectedEntities: { cardinalityText: string, entity: GNode }[] = [];
        const edges = root.children.filter(child => child instanceof GEdge && child.targetId === relation.id) as GEdge[];
        for (const edge of edges) {
            const object: { cardinalityText: string, entity: GNode } = { cardinalityText: SQLUtils.getCardinality(edge), entity: SQLUtils.findById(edge.sourceId, root) as GNode };
            connectedEntities.push(object);
        }
        return connectedEntities;
    }

}