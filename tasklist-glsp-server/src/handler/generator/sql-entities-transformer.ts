import { GModelElement } from "@eclipse-glsp/server";
import { AttributeTransformer } from "./sql-attribute-transformer";
import { NodeData, NodeRegistry } from "./sql-interfaces";
import { RelationsTransformer } from "./sql-relations-transformer";
import { SQLUtils } from "./sql-utils";

export class EntitiesTransformer {
    
    static processEntity(entityData: NodeData, root: GModelElement, nodeRegistry: NodeRegistry) {
        let columns: string[] = [];
        let compositePK: string[] = [];
        let compositeUnique: string[] = [];
        let tableConstraints: string[] = [];
            
        AttributeTransformer.transformPKs(entityData, columns, compositePK);
        AttributeTransformer.transformUnique(entityData, columns, compositeUnique, root);
        AttributeTransformer.transformSimple(entityData, columns, root);
        AttributeTransformer.transformOptionals(entityData, columns);

        const multivaluedRelation1N = RelationsTransformer.transform1Nrelation(entityData, columns, compositeUnique, tableConstraints, root, nodeRegistry);
        const multivaluedRelation11 = RelationsTransformer.processBinary11Relation(entityData, columns, compositeUnique, tableConstraints, root, nodeRegistry);

        if (compositePK.length > 0) tableConstraints.push(`PRIMARY KEY (${compositePK.join(", ")})`);
        tableConstraints.push(...compositeUnique);

        let sql = SQLUtils.buildTable(entityData.name, columns, tableConstraints);
        
        entityData.attributes.multiValued.forEach(mv => {
            sql += AttributeTransformer.processMultivalued(entityData.name, entityData.attributes.pk.flat(), mv, root);
        });

        return sql + multivaluedRelation1N + multivaluedRelation11;
    }

}