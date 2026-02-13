import { GModelElement, GNode } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { ENTITY_TYPE, RELATION_TYPE } from '../validation/utils/validation-constants';
import { AttributeTransformer } from './sql-attribute-transformer';
import { EntitiesTransformer } from './sql-entities-transformer';
import { EntityNodes, RelationNodes } from './sql-interfaces';
import { RelationsTransformer } from './sql-relations-transformer';
import { SQLUtils } from './sql-utils';

@injectable()
export class SQLGenerator {
    
    private entityNodes: EntityNodes = new Map();
    private relationNodes: RelationNodes = new Map();

    public generate(root: GModelElement): string {
        this.entityNodes.clear();
        this.relationNodes.clear();

        // 1.- Collect all entities
        const entities = root.children.filter(child => child.type === ENTITY_TYPE) as GNode[];
        for (const entity of entities) {
            this.entityNodes.set(entity.id, {
                name: SQLUtils.cleanNames(entity),
                node: entity,
                type: entity.type,
                attributes: AttributeTransformer.getAllAttributes(entity, root)
            });
        }

        // 2.- Collect relations
        const relations = root.children.filter(child => child.type === RELATION_TYPE) as GNode[];
        for (const relation of relations) {
            this.relationNodes.set(relation.id, {
                name: SQLUtils.cleanNames(relation),
                node: relation,
                type: relation.type,
                cardinality: SQLUtils.getCardinality(relation),
                isReflexive: RelationsTransformer.isReflexive(relation, root),
                attributes: AttributeTransformer.getAllAttributes(relation, root),
                connectedEntities: RelationsTransformer.getConnectedEntities(relation, root)
            });
        }

        let sql = "-- Fecha: " + new Date().toLocaleString() + "\n\n";

        this.entityNodes.forEach(entity => {
            sql += EntitiesTransformer.processEntity(entity, root);
        });

        this.relationNodes.forEach(relation => {
            if (relation.cardinality.includes("N:M")) sql += RelationsTransformer.processRelationNM(relation, root);
        });
        
        return sql;
    }

}