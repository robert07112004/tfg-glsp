import { GEdge, GModelElement, GNode } from "@eclipse-glsp/server";
import { PARTIAL_EXCLUSIVE_SPECIALIZATION_TYPE, PARTIAL_OVERLAPPED_SPECIALIZATION_TYPE, TOTAL_EXCLUSIVE_SPECIALIZATION_TYPE, TOTAL_OVERLAPPED_SPECIALIZATION_TYPE } from "../validation/utils/validation-constants";
import { AttributeTransformer } from "./sql-attribute-transformer";
import { EntitiesTransformer } from "./sql-entities-transformer";
import { Entity, SpecializationNodes } from "./sql-interfaces";
import { SQLUtils } from "./sql-utils";

export class SpecializationsTransformer {

    static processSpecialization(entity: Entity, specializationNodes: SpecializationNodes, foreignColumns: string[], foreignKeys: string[], inheritedPKNames: string[], specializationRestrictions: string[], root: GModelElement) {
        const dependencies = new Set<string>();

        for (const spec of specializationNodes.values()) {
            const asChild = spec.children.find(child => child.node.id === entity.node.id);
            if (asChild) {
                const father = spec.father.node;
                let fatherPKs: GNode[] = [];

                dependencies.add(SQLUtils.cleanNames(father));

                let isWeakEntityFromIdentifyingDependence = false;
                AttributeTransformer.transformSimple(father, root).forEach(simple => {
                    const {name} = SQLUtils.getNameAndType(simple);
                    if (name.includes("_disc")) {
                        fatherPKs.push(simple);
                        isWeakEntityFromIdentifyingDependence = true;
                    }
                });
                if (isWeakEntityFromIdentifyingDependence) {
                    fatherPKs = fatherPKs.concat(EntitiesTransformer.getFatherPKsFromWeakEntity(father, root));
                } else fatherPKs = AttributeTransformer.transformPKs(father, root);

                let fatherPKsName: string[] = [];
                if (fatherPKs.length === 1) {
                    const { name, type } = SQLUtils.getNameAndType(fatherPKs[0]);
                    fatherPKsName.push(name);
                    foreignColumns.push(`    ${name} ${type} NOT NULL PRIMARY KEY`);
                } else {
                    fatherPKs.forEach(pkNode => {
                        const { name, type } = SQLUtils.getNameAndType(pkNode);
                        fatherPKsName.push(name);
                        foreignColumns.push(`    ${name} ${type} NOT NULL`);
                        inheritedPKNames.push(name);
                    });
                }

                if (spec.type === PARTIAL_EXCLUSIVE_SPECIALIZATION_TYPE || spec.type === TOTAL_EXCLUSIVE_SPECIALIZATION_TYPE) {
                    foreignColumns.push(`    tipo_${entity.name} VARCHAR(100) DEFAULT '${entity.name}' NOT NULL`);
                    specializationRestrictions.push(`    CHECK (tipo_${entity.name} = '${entity.name}')`);
                    foreignKeys.push(`    FOREIGN KEY (${fatherPKsName.join(", ")}, tipo_${entity.name}) REFERENCES ${spec.father.name}(${fatherPKsName.join(", ")}, tipo_${spec.father.name}) ON DELETE CASCADE`);
                } else if (spec.type === PARTIAL_OVERLAPPED_SPECIALIZATION_TYPE || spec.type === TOTAL_OVERLAPPED_SPECIALIZATION_TYPE) {
                    foreignColumns.push(`    tipo_${entity.name} BOOLEAN DEFAULT TRUE NOT NULL`);
                    specializationRestrictions.push(`    CHECK (tipo_${entity.name} = TRUE)`);
                    foreignKeys.push(`    FOREIGN KEY (${fatherPKsName.join(", ")}, tipo_${entity.name}) REFERENCES ${spec.father.name}(${fatherPKsName.join(", ")}, tipo_${spec.father.name}) ON DELETE CASCADE`);
                }
            }
        }
        return dependencies;
    }

    static findFather(node: GNode, root: GModelElement): Entity {
        const findInputEdge = root.children.find(child => child instanceof GEdge && child.targetId === node.id) as GEdge;
        const fatherNode = SQLUtils.findById(findInputEdge.sourceId, root) as GNode;
        if (!fatherNode) {
            throw new Error(`Diagram Error: Father node not found for edge ${findInputEdge.id}.`);
        }
        return { 
            name: SQLUtils.cleanNames(fatherNode),
            node: fatherNode,
            type: fatherNode.type,
            attributes: AttributeTransformer.getAllAttributes(fatherNode, root)
        }
    }

    static findChildren(node: GNode, root: GModelElement): Entity[] {
        const findOutputEdges = root.children.filter(child => child instanceof GEdge && child.sourceId === node.id) as GEdge[];
        const childrenEntities: Entity[] = [];

        for (const outputEdge of findOutputEdges) {
            const targetElement = SQLUtils.findById(outputEdge.targetId, root);
            if (targetElement instanceof GNode) {
                childrenEntities.push({
                    name: SQLUtils.cleanNames(targetElement),
                    node: targetElement,
                    type: targetElement.type,
                    attributes: AttributeTransformer.getAllAttributes(targetElement, root)
                });
            }
        }
        return childrenEntities;
    }

    static getEnum(node: GNode, root: GModelElement): string {
        const children = SpecializationsTransformer.findChildren(node, root);
        return children.map(child => `'${child.name}'`).join(", ");
    }

    static getDiscriminator(node: GNode, root: GModelElement): string {
        const father = SpecializationsTransformer.findFather(node, root);
        return "tipo_" + father.name + " VARCHAR(100)";
    }

}