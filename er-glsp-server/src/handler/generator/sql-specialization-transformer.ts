import { Entity, ErModel, WeakEntity } from "../../model/er-model";
import { SpecInfo } from "./sql-interfaces";
import { SQLUtils } from "./sql-utils";

export class SpecializationTransformer {

    /**
     * Recorre todos los nodos de especialización del ErModel y construye dos Maps:
     *   - byFather: entityId → SpecInfo  (para saber si una entidad es padre de una jerarquía)
     *   - byChild:  entityId → SpecInfo  (para saber si una entidad es hija de una jerarquía)
     *
     * Conectividad de las especializaciones en el ErModel (confirmado por el validator):
     *   - Padre → Especialización: transition cuyo targetId es el nodo de especialización
     *   - Especialización → Hijos: transitions cuyo sourceId es el nodo de especialización
     */
    static preCompute(erModel: ErModel): { byFather: Map<string, SpecInfo[]>; byChild: Map<string, SpecInfo> } {
        const byFather = new Map<string, SpecInfo[]>();
        const byChild = new Map<string, SpecInfo>();
        const allEntities = [...(erModel.entities || []), ...(erModel.weakEntities || [])];

        const allSpecs: { id: string; type: string }[] = [
            ...(erModel.partialExclusiveSpecializations || []),
            ...(erModel.totalExclusiveSpecializations || []),
            ...(erModel.partialOverlappedSpecializations || []),
            ...(erModel.totalOverlappedSpecializations || [])
        ];

        for (const spec of allSpecs) {
            // El padre es la entidad cuya transition apunta A este nodo de especialización
            const fatherTransition = (erModel.transitions || []).find(t => t.targetId === spec.id);
            if (!fatherTransition) continue;

            const father = allEntities.find(e => e.id === fatherTransition.sourceId);
            if (!father) continue;

            // Los hijos son las entidades a las que este nodo apunta mediante transitions
            const childTransitions = (erModel.transitions || []).filter(t => t.sourceId === spec.id);
            const children = childTransitions
                .map(t => allEntities.find(e => e.id === t.targetId))
                .filter((e): e is Entity | WeakEntity => !!e);

            const fatherName = SQLUtils.parseNameAndType(father.name).name;
            const existingHierarchies = byFather.get(father.id) ?? [];

            // Calcular nombre de columna discriminadora para especializaciones exclusivas.
            // Si el mismo padre ya tiene otra jerarquía exclusiva, añadimos sufijo _2, _3, etc.
            // para evitar colisión de nombres en la tabla padre.
            let discriminatorCol: string | undefined;
            const isExclusive = spec.type === 'totalExclusiveSpecialization' || spec.type === 'partialExclusiveSpecialization';
            if (isExclusive) {
                const existingExclusiveCount = existingHierarchies.filter(s =>
                    s.specType === 'totalExclusiveSpecialization' || s.specType === 'partialExclusiveSpecialization'
                ).length;
                discriminatorCol = existingExclusiveCount === 0
                    ? `tipo_${fatherName}`
                    : `tipo_${fatherName}_${existingExclusiveCount + 1}`;
            }

            const info: SpecInfo = {
                specType: spec.type,
                fatherId: father.id,
                fatherName,
                childrenIds: children.map(c => c.id),
                childNames: children.map(c => SQLUtils.parseNameAndType(c.name).name),
                discriminatorCol
            };

            // Acumular (no sobreescribir): un padre puede tener múltiples jerarquías.
            existingHierarchies.push(info);
            byFather.set(father.id, existingHierarchies);
            children.forEach(c => byChild.set(c.id, info));
        }

        return { byFather, byChild };
    }

    /**
     * Genera las columnas discriminadoras que se añaden a la tabla del PADRE.
     *
     * Exclusiva parcial:  tipo_Padre ENUM('H1','H2','Otro') NULL
     * Exclusiva total:    tipo_Padre ENUM('H1','H2') NOT NULL
     * Solapada parcial:   es_H1 BOOLEAN ..., es_H2 BOOLEAN ...
     * Solapada total:     igual que parcial + CHECK(es_H1 OR es_H2)
     */
    static buildFatherDiscriminatorColumns(fatherName: string, specInfo: SpecInfo): { columns: string[]; constraints: string[] } {
        const columns: string[] = [];
        const constraints: string[] = [];
        const { specType, childNames } = specInfo;
        const enumValues = childNames.map(n => `'${n}'`).join(', ');
        // Usar el nombre de columna pre-calculado (incluye sufijo si hay múltiples jerarquías exclusivas)
        const colName = specInfo.discriminatorCol ?? `tipo_${fatherName}`;

        if (specType === 'partialExclusiveSpecialization') {
            columns.push(`    ${colName} ENUM(${enumValues}, 'Otro') NULL`);

        } else if (specType === 'totalExclusiveSpecialization') {
            columns.push(`    ${colName} ENUM(${enumValues}) NOT NULL`);

        } else if (specType === 'partialOverlappedSpecialization' || specType === 'totalOverlappedSpecialization') {
            childNames.forEach(child => {
                columns.push(`    es_${child} BOOLEAN DEFAULT FALSE NOT NULL`);
            });
            if (specType === 'totalOverlappedSpecialization') {
                const orConditions = childNames.map(c => `es_${c} = TRUE`).join(' OR ');
                constraints.push(`    CHECK (${orConditions})`);
            }
        }

        return { columns, constraints };
    }
}
