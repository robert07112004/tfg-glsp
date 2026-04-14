import { GEdge, GModelElement, GNode } from "@eclipse-glsp/server";
import { PARTIAL_EXCLUSIVE_SPECIALIZATION_TYPE, TOTAL_EXCLUSIVE_SPECIALIZATION_TYPE, WEAK_ENTITY_TYPE } from "../validation/utils/validation-constants";
import { AttributeTransformer } from "./sql-attribute-transformer";
import { EntitiesTransformer } from "./sql-entities-transformer";
import { Entity, SpecializationNodes } from "./sql-interfaces";
import { SQLUtils } from "./sql-utils";

export class SpecializationsTransformer {

    static processSpecialization(entity: Entity, specializationNodes: SpecializationNodes, foreignColumns: string[], foreignKeys: string[], inheritedPKNames: string[], specializationRestrictions: string[], root: GModelElement): Set<string> {
        const dependencies = new Set<string>();

        for (const spec of specializationNodes.values()) {
            const asChild = spec.children.find(child => child.node.id === entity.node.id);

            if (asChild) {
                const fatherNode = spec.father.node;
                const fatherName = spec.father.name;
                dependencies.add(fatherName);

                // Estructura para mapear: Nombre en tabla hijo -> Nombre en tabla padre
                const identityMapping: { childCol: string, fatherCol: string, type: string }[] = [];

                // 1. OBTENER LAS COLUMNAS QUE FORMAN LA IDENTIDAD DEL PADRE
                if (fatherNode.type === WEAK_ENTITY_TYPE) {
                    // Si el padre es débil, su identidad es: (Relacion_PK_Abuelo + Discriminadores)
                    const { name: identifyingRelName, pks: grandfatherPKs } = EntitiesTransformer.getFatherPKsFromWeakEntity(fatherNode, root);

                    console.log(grandfatherPKs.length);

                    // A) Parte heredada del abuelo (Ej: Consta_Cod_comunidad)
                    grandfatherPKs.forEach(gp => {
                        const { name, type } = SQLUtils.getNameAndType(gp);
                        const realFatherCol = `${identifyingRelName}_${name}`;
                        identityMapping.push({ childCol: name, fatherCol: realFatherCol, type });
                    });

                    // B) Discriminadores del padre (Ej: Portal_disc)
                    AttributeTransformer.transformSimple(fatherNode, root).forEach(simple => {
                        const { name, type } = SQLUtils.getNameAndType(simple);
                        if (name.includes("_disc")) {
                            identityMapping.push({ childCol: name, fatherCol: name, type });
                        }
                    });
                } else {
                    // Si el padre es fuerte, su identidad son sus PKs normales
                    const fatherPKs = AttributeTransformer.transformPKs(fatherNode, root);
                    fatherPKs.forEach(pk => {
                        const { name, type } = SQLUtils.getNameAndType(pk);
                        identityMapping.push({ childCol: name, fatherCol: name, type });
                    });
                }

                // 2. GENERAR COLUMNAS EN LA TABLA HIJO (PK del hijo = PK del padre)
                identityMapping.forEach(map => {
                    // En el hijo usamos el nombre limpio (childCol) para que no arrastre prefijos de relaciones ajenas
                    foreignColumns.push(`    ${map.childCol} ${map.type} NOT NULL`);
                    inheritedPKNames.push(map.childCol);
                });

                // 3. GENERAR EL DISCRIMINADOR DE LA HERENCIA (tipo_Entidad o es_Entidad)
                const discriminatorCol = `tipo_${entity.name}`;
                if (spec.type === TOTAL_EXCLUSIVE_SPECIALIZATION_TYPE || PARTIAL_EXCLUSIVE_SPECIALIZATION_TYPE) {
                    // Exclusive
                    foreignColumns.push(`    ${discriminatorCol} VARCHAR(100) DEFAULT '${entity.name}' NOT NULL`);
                    specializationRestrictions.push(`    CHECK (${discriminatorCol} = '${entity.name}')`);
                } else {
                    // Overlapped
                    foreignColumns.push(`    ${discriminatorCol} BOOLEAN DEFAULT TRUE NOT NULL`);
                    specializationRestrictions.push(`    CHECK (${discriminatorCol} = TRUE)`);
                }

                // 4. GENERAR LA FOREIGN KEY HACIA EL PADRE
                // Debe apuntar exactamente a las columnas del padre y al discriminador del padre
                const childCols = [...identityMapping.map(m => m.childCol), discriminatorCol].join(", ");
                const fatherCols = [...identityMapping.map(m => m.fatherCol), `tipo_${fatherName}`].join(", ");

                foreignKeys.push(`    FOREIGN KEY (${childCols}) REFERENCES ${fatherName}(${fatherCols}) ON DELETE CASCADE`);
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