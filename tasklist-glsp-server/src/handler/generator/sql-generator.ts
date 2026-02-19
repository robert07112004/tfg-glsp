import { GModelElement, GNode } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { ENTITY_TYPE, EXISTENCE_DEP_RELATION_TYPE, IDENTIFYING_DEP_RELATION_TYPE, RELATION_TYPE, specializationTypes, WEAK_ENTITY_TYPE } from '../validation/utils/validation-constants';
import { AttributeTransformer } from './sql-attribute-transformer';
import { EntitiesTransformer } from './sql-entities-transformer';
import { EntityNodes, GeneratedTable, RelationNodes, SpecializationNodes } from './sql-interfaces';
import { RelationsTransformer } from './sql-relations-transformer';
import { SpecializationsTransformer } from './sql-specializations-transformer';
import { SQLUtils } from './sql-utils';

@injectable()
export class SQLGenerator {
    
    private entityNodes: EntityNodes = new Map();
    private relationNodes: RelationNodes = new Map();
    private specializationNodes: SpecializationNodes = new Map();

    public generate(root: GModelElement): string {
        this.entityNodes.clear();
        this.relationNodes.clear();
        this.specializationNodes.clear();

        // 1.- Collect entity nodes
        const entities = root.children.filter(child => child.type === ENTITY_TYPE || child.type === WEAK_ENTITY_TYPE) as GNode[];
        for (const entity of entities) {
            this.entityNodes.set(entity.id, {
                name: SQLUtils.cleanNames(entity),
                node: entity,
                type: entity.type,
                attributes: AttributeTransformer.getAllAttributes(entity, root)
            });
        }

        // 2.- Collect relation nodes
        const relations = root.children.filter(child => child.type === RELATION_TYPE || child.type === EXISTENCE_DEP_RELATION_TYPE || child.type === IDENTIFYING_DEP_RELATION_TYPE) as GNode[];
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

        // 3.- Collect specialization nodes
        const specializations = root.children.filter(child => specializationTypes.includes(child.type)) as GNode[];
        for (const specialization of specializations) {
            this.specializationNodes.set(specialization.id, {
                node: specialization,
                type: specialization.type,
                father: SpecializationsTransformer.findFather(specialization, root),
                children: SpecializationsTransformer.findChildren(specialization, root),
                enum: SpecializationsTransformer.getEnum(specialization, root),
                discriminator: SpecializationsTransformer.getDiscriminator(specialization, root)
            });
        }

        let sql = "-- Fecha: " + new Date().toLocaleString() + "\n\n";

        const allTables: GeneratedTable[] = [];

        this.entityNodes.forEach(entity => {
            allTables.push(EntitiesTransformer.processEntity(entity, this.relationNodes, this.specializationNodes, root));
        });

        this.relationNodes.forEach(relation => {
            if (relation.cardinality.includes("N:M")) allTables.push(RelationsTransformer.processRelationNM(relation, root));
        });

        sql += this.sortTables(allTables);
        
        return sql;
    }

    private sortTables(tables: GeneratedTable[]): string {
        const sorted: string[] = [];
        const createdTableNames = new Set<string>();
        let remaining = [...tables];

        while (remaining.length > 0) {
            const initialLength = remaining.length;
            
            remaining = remaining.filter(table => {
                const canCreate = table.dependencies.every(dep => 
                    createdTableNames.has(dep) || dep === table.name
                );

                if (canCreate) {
                    sorted.push(table.sql);
                    createdTableNames.add(table.name);
                    return false;
                }
                return true;
            });

            // Evitar bucle infinito si hay dependencias circulares
            if (remaining.length === initialLength && remaining.length > 0) {
                const forced = remaining.shift()!;
                sorted.push(forced.sql);
                createdTableNames.add(forced.name);
            }
        }
        return sorted.join("");
    }

}