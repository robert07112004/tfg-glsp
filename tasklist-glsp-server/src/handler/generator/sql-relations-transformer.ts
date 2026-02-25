import { GEdge, GModelElement, GNode } from "@eclipse-glsp/server";
import { ENTITY_TYPE, EXISTENCE_DEP_RELATION_TYPE, IDENTIFYING_DEP_RELATION_TYPE, RELATION_TYPE, WEAK_ENTITY_TYPE } from "../validation/utils/validation-constants";
import { AttributeTransformer } from "./sql-attribute-transformer";
import { EntitiesTransformer } from "./sql-entities-transformer";
import { Entity, GeneratedTable, PKMapping, Relation, RelationNodes } from "./sql-interfaces";
import { SQLUtils } from "./sql-utils";

export class RelationsTransformer {

	/**
	 * Procesa una relación de muchos a muchos incluyendo relaciones ternarias para generar su tabla SQL correspondiente.
	 * @param relation Objeto con la información de la relación y sus atributos.
	 * @param root El elemento raíz del modelo GModel.
	 * @returns Un objeto GeneratedTable con el SQL y sus dependencias.
	 */

	static processRelationNM(relation: Relation, root: GModelElement): GeneratedTable {
		const dependencies = new Set<string>();
		const tableLines: string[] = [];
		const pkColumns: string[] = [];
		const fkConstraints: string[] = [];
		const isReflexive = this.isReflexive(relation.node, root);
		const colNameMapping: PKMapping[] = [];

		// 1. Procesar atributos propios del rombo
		const { columnPKs, restriction: relPkRest } = AttributeTransformer.processPK(relation.attributes.pk);
		const { columns: uniqueColumns, restriction: relUniqueRest } = AttributeTransformer.processUnique(relation.attributes.unique);
		const simpleAttributes = AttributeTransformer.processSimpleAttributes(relation.attributes.simple);
		const optionalAttributes = AttributeTransformer.processOptionalAttributes(relation.attributes.optional);

		if (relation.attributes.pk.length > 0) {
			relation.attributes.pk.forEach(pkNode => {
				const { name } = SQLUtils.getNameAndType(pkNode);
				colNameMapping.push({ node: pkNode, tableName: relation.name, colName: name });
			});
			tableLines.push(...columnPKs);
		}

		// Lógica para determinar qué entidades van a la PK (para ternarias)
		//const manySides = relation.connectedEntities.filter(ce => ce.cardinalityText.includes("N"));
		const isTernary = relation.connectedEntities.length === 3;

		// 2. Procesar cada entidad conectada
		relation.connectedEntities.forEach((conn, index) => {
			const entityName = SQLUtils.cleanNames(conn.entity);
			dependencies.add(entityName);

			// --- OBTENER IDENTIDAD COMPLETA DE LA ENTIDAD ---
			let identityNodes: GNode[] = [];
			if (conn.entity.type === WEAK_ENTITY_TYPE) {
				// Si es débil, su identidad es: PKs del padre + sus discriminadores
				const weakInfo = EntitiesTransformer.getFatherPKsFromWeakEntity(conn.entity, root);
				identityNodes = [...weakInfo.pks];
				AttributeTransformer.transformSimple(conn.entity, root).forEach(s => {
					if (SQLUtils.getNameAndType(s).name.includes("_disc")) identityNodes.push(s);
				});
			} else {
				// Si es fuerte, solo sus PKs
				identityNodes = AttributeTransformer.transformPKs(conn.entity, root);
			}

			// Listas para construir la FK agrupada de ESTA entidad
			const localColsForThisEntity: string[] = [];
			const refColsInTargetTable: string[] = [];

			identityNodes.forEach(node => {
				const { name, type } = SQLUtils.getNameAndType(node);

				// Si es reflexiva usamos sufijos, si no, el nombre original
				let colName = isReflexive ? `${name}_${index + 1}` : name;

				// Evitar duplicados de nombres en la misma tabla de relación
				if (tableLines.some(line => line.includes(`    ${colName} `))) {
					colName = `${entityName}_${colName}`;
				}

				tableLines.push(`    ${colName} ${type} NOT NULL`);
				localColsForThisEntity.push(colName);
				refColsInTargetTable.push(name);

				// Obtenemos la cardinalidad global calculada del rombo (ej: "N:M:P", "1:N:M")
				const relCardinality = relation.cardinality;
				// Obtenemos la cardinalidad de la arista actual (ej: "0..N", "1..1")
				const edgeCardinality = conn.cardinalityText.toUpperCase();

				if (relation.attributes.pk.length === 0) {
					let inPK = false;

					if (!isTernary) inPK = true; // En una relación binaria N:M, ambas entidades siempre forman la PK
					else {
						if (relCardinality === "N:M:P") {
							// Si es N:M:P, todas las entidades (las 3) forman parte de la PK
							if (edgeCardinality.includes("..N")) inPK = true;
						}
						else if (relCardinality === "1:N:M") {
							// Si es 1:N:M, solo las dos entidades del lado "Muchos" van a la PK
							if (edgeCardinality.includes("..N")) inPK = true;
						}
						else if (relCardinality === "1:1:N") {
							// Si es 1:1:N, la teoría dice que la PK se forma con las dos entidades del lado "1"
							if (edgeCardinality.includes("..1")) inPK = true;
						}
						else if (relCardinality === "1:1:1") {
							// Caso teórico 1:1:1: Cualquier combinación de dos entidades sirve como PK. (tomamos las dos primeras que procesamos)
							if (index < 2) inPK = true;
						}
					}

					if (inPK) {
						pkColumns.push(colName);
						colNameMapping.push({ node, tableName: entityName, colName: colName });
					}
				}
			});

			// --- GENERAR LA FOREIGN KEY AGRUPADA (Para esta entidad) ---
			// Ejemplo: FOREIGN KEY (id_aula, num_puesto) REFERENCES Ordenador(id_aula, num_puesto)
			const fkLine = `    FOREIGN KEY (${localColsForThisEntity.join(", ")}) REFERENCES ${entityName}(${refColsInTargetTable.join(", ")})`;
			fkConstraints.push(fkLine);
		});

		// 3. Finalizar cuerpo de la tabla
		tableLines.push(...uniqueColumns, ...simpleAttributes, ...optionalAttributes);

		if (relation.attributes.pk.length === 0 && pkColumns.length > 0) {
			tableLines.push(`    PRIMARY KEY (${pkColumns.join(', ')})`);
		} else if (relPkRest.length > 0) {
			tableLines.push(...relPkRest);
		}

		if (relUniqueRest.length > 0) tableLines.push(...relUniqueRest);

		// Añadir las FKs al final
		tableLines.push(...fkConstraints);

		let sql = `CREATE TABLE ${relation.name} (\n${tableLines.join(",\n")}\n);\n\n`;

		// 4. Multivaluados
		let multivaluedSql: string[] = [];
		if (relation.attributes.multiValued.length > 0) {
			relation.attributes.multiValued.forEach(mv => {
				mv.parentPKs = colNameMapping;
				mv.parentName = relation.name;
			});
			multivaluedSql = AttributeTransformer.processMultivaluedAttributes(relation.attributes.multiValued, relation.node, root);
		}

		return {
			name: relation.name,
			sql: sql + multivaluedSql.join("\n"),
			dependencies: Array.from(dependencies)
		};
	}

	/*static processRelationNM(relation: Relation, root: GModelElement): GeneratedTable {
		const dependencies = new Set<string>();
		const tableLines: string[] = [];
		const pkColumns: string[] = [];
		const fkColumns: string[] = [];
		const isReflexive = this.isReflexive(relation.node, root);      // Booleano para saber si es reflexiva

		// guardar los nombres de las PKs para referenciar a su padre en la tabla del atributo multivaluado
		const colNameMapping: PKMapping[] = [];

		// Procesar atributos de la relacion
		const { columnPKs, restriction: relPkRest } = AttributeTransformer.processPK(relation.attributes.pk);
		const { columns: uniqueColumns, restriction: relUniqueRest } = AttributeTransformer.processUnique(relation.attributes.unique);
		const simpleAttributes = AttributeTransformer.processSimpleAttributes(relation.attributes.simple);
		const optionalAttributes = AttributeTransformer.processOptionalAttributes(relation.attributes.optional);

		// Si la relación tiene su propia PK definida, la mapeamos
		if (relation.attributes.pk.length > 0) {
			relation.attributes.pk.forEach(pkNode => {
				const { name } = SQLUtils.getNameAndType(pkNode);
				colNameMapping.push({ node: pkNode, tableName: relation.name, colName: name });
			});
			tableLines.push(...columnPKs);
		}

		const isBinary = relation.connectedEntities.length === 2;
		const weakEntityPks: GNode[] = [];
		let fatherWeakEntityName = "";

		// Procesar entidades conectadas para obtener las FKs (y PKs si la relación no tiene una propia)
		relation.connectedEntities.forEach((conn, index) => {
			const entityName = SQLUtils.cleanNames(conn.entity);
			dependencies.add(entityName);
			if (conn.entity.type === ENTITY_TYPE) {
				const entityPkNodes = AttributeTransformer.transformPKs(conn.entity, root);
				entityPkNodes.forEach(pkNode => {
					const { name, type } = SQLUtils.getNameAndType(pkNode);
					const colName = isReflexive ? `${name}_${index + 1}` : name;        // Si es reflexiva, evitamos colisión de nombres (ej: id_1, id_2)
					tableLines.push(`    ${colName} ${type} NOT NULL`);
					fkColumns.push(this.generateFKLine(colName, entityName, name, relation.type));
					if (isBinary) {
						if (relation.attributes.pk.length === 0) {
							pkColumns.push(colName);
							colNameMapping.push({ node: pkNode, tableName: entityName, colName: colName });
						}
					}
				});
			} else {
				const { name, pks } = EntitiesTransformer.getFatherPKsFromWeakEntity(conn.entity, root);
				fatherWeakEntityName = name;
				weakEntityPks.push(...pks);
				AttributeTransformer.transformSimple(conn.entity, root).forEach(sNode => {
					const { name } = SQLUtils.getNameAndType(sNode);
					if (name.includes("_disc")) weakEntityPks.push(sNode);
				});
			}
		});

		const weakEntityPksNames: string[] = [];
		weakEntityPks.forEach(node => {
			const { name, type } = SQLUtils.getNameAndType(node);
			tableLines.push(`    ${name} ${type} NOT NULL`);
			weakEntityPksNames.push(name);
		});

		fkColumns.push(this.generateFKLine(weakEntityPksNames.join(", "), fatherWeakEntityName, weakEntityPksNames.join(", "), RELATION_TYPE));

		if (isBinary) {
			if (relation.attributes.pk.length === 0) {
				pkColumns.push(colName);
				colNameMapping.push({ node: pkNode, tableName: entityName, colName: colName });
			}
		}

		if (isBinary) {
			let entityPkNodes: GNode[] = [];
			entityPkNodes.forEach(pkNode => {
				const { name, type } = SQLUtils.getNameAndType(pkNode);
				const colName = isReflexive ? `${name}_${index + 1}` : name;        // Si es reflexiva, evitamos colisión de nombres (ej: id_1, id_2)
				tableLines.push(`    ${colName} ${type} NOT NULL`);

				// Si la relación NO tiene PK propia, la PK de la tabla será la combinación de las PKs de las entidades
				if (relation.attributes.pk.length === 0) {
					pkColumns.push(colName);
					colNameMapping.push({ node: pkNode, tableName: entityName, colName: colName });
				}

				fkColumns.push(this.generateFKLine(colName, entityName, name, relation.type));
			});
		} else {
			let weakEntityPkNodes: GNode[] = [];
			weakEntityPkNodes.push(...EntitiesTransformer.getFatherPKsFromWeakEntity(conn.entity, root).pks);
			AttributeTransformer.transformSimple(conn.entity, root).forEach(sNode => {
				const { name } = SQLUtils.getNameAndType(sNode);
				if (name.includes("_disc")) weakEntityPkNodes.push(sNode);
			});
			if (relation.cardinality.includes("N:M:P")) {

			}

		}

		// Añadir atributos unique, simples y opcionales
		tableLines.push(
			...uniqueColumns,
			...simpleAttributes,
			...optionalAttributes
		);

		// Añadir la Primary Key constraint
		if (relation.attributes.pk.length === 0 && pkColumns.length > 0) tableLines.push(`    PRIMARY KEY (${pkColumns.join(', ')})`);
		else if (relPkRest.length > 0) tableLines.push(...relPkRest);

		if (relUniqueRest.length > 0) tableLines.push(...relUniqueRest);            // Añadir la UNIQUE constraint

		tableLines.push(...fkColumns);                                              // Añadir las Foreign Keys al final

		// SQL
		let sql = `CREATE TABLE ${relation.name} (\n`;
		sql += tableLines.join(",\n") + "\n);\n\n";

		let multivaluedSql: string[] = [];
		if (relation.attributes.multiValued.length > 0) {
			// Inyectamos el mapeo de nombres de columnas para que las tablas de multivaluados sepan a qué columnas referenciar
			relation.attributes.multiValued.forEach(mv => {
				mv.parentPKs = colNameMapping;
				mv.parentName = relation.name;
			});
			// Procesar atributos multivaluados
			multivaluedSql = AttributeTransformer.processMultivaluedAttributes(relation.attributes.multiValued, relation.node, root);
		}

		return {
			name: relation.name,
			sql: sql + multivaluedSql.join("\n"),
			dependencies: Array.from(dependencies)
		};
	}

	private static generateFKLine(col: string, refTable: string, refCol: string, relType: string): string {
		let fkLine = `    FOREIGN KEY (${col}) REFERENCES ${refTable}(${refCol})`;
		if (relType === EXISTENCE_DEP_RELATION_TYPE) {
			fkLine += " ON DELETE CASCADE";                 // Si es una dependencia de existencia, añadimos el borrado en cascada
		}
		return fkLine;
	}*/

	static isReflexive(relation: GNode, root: GModelElement): boolean {
		const uniqueEntities = new Set<string>();
		const edges = root.children.filter(child => child instanceof GEdge && child.targetId === relation.id) as GEdge[];
		edges.forEach(edge => uniqueEntities.add(edge.sourceId));
		return uniqueEntities.size === 1 && edges.length > 1;
	}

	static getConnectedEntities(relation: GNode, root: GModelElement): { cardinalityText: string, entity: GNode }[] {
		const edges = root.children.filter(child => child instanceof GEdge && child.targetId === relation.id) as GEdge[];
		return edges.map(edge => ({
			cardinalityText: SQLUtils.getCardinality(edge),
			entity: SQLUtils.findById(edge.sourceId, root) as GNode
		}));
	}

	/**
	 * Procesa relaciones 1:N -> Entidad actual es la entidad del lado N y absorbe la clave primaria del lado 1
	 * @param entity La entidad actual que se está transformando en tabla.
	 * @param relationNodes Mapa con todas las relaciones detectadas en el diagrama.
	 * @param foreignColumns Array donde se añadirán las definiciones de columnas de las claves foráneas.
	 * @param foreignKeys Array donde se añadirán las restricciones (constraints) FOREIGN KEY.
	 * @param relationAttributes Array para almacenar atributos simples u opcionales que provengan del rombo de la relación.
	 * @param relationRestrictions Array para almacenar restricciones UNIQUE o CHECK provenientes de la relación.
	 * @param relationMultivalued Array que recopila el código SQL generado para los atributos multivaluados de la relación.
	 * @param root El modelo completo (GModel) para realizar búsquedas de otros nodos y aristas.
	 * @returns Un Set con los nombres de las tablas de las que depende esta entidad.
	 */
	static process1NRelation(entity: Entity, relationNodes: RelationNodes, foreignColumns: string[], foreignKeys: string[], relationAttributes: string[], relationRestrictions: string[], relationMultivalued: string[], root: GModelElement) {
		const dependencies = new Set<string>();
		for (const relation of relationNodes.values()) {
			const is1N = relation.cardinality.includes("1:N") && relation.type === RELATION_TYPE;
			if (is1N) {
				const sideN = relation.connectedEntities.find(ce => ce.cardinalityText.toUpperCase().includes("N"));
				const side1 = relation.connectedEntities.find(ce => ce.cardinalityText.includes("1") && !ce.cardinalityText.toUpperCase().includes("N"));

				// Si somos el lado N, dependemos del lado 1 y absorbemos la relación
				if (sideN && sideN.entity.id === entity.node.id && side1) {
					dependencies.add(SQLUtils.cleanNames(side1.entity));
					this.absorbRelation(relation, side1.entity, sideN.cardinalityText, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);
				}
			}
		}
		return dependencies;
	}

	/**
	 * Procesa relaciones 1:1 -> Decide que entidad absorbe a cual basandose en la opcionalidad o en el ID del nodo
	 * @param entity La entidad actual que se está transformando en tabla.
	 * @param relationNodes Mapa con todas las relaciones detectadas en el diagrama.
	 * @param foreignColumns Array donde se añadirán las definiciones de columnas de las claves foráneas.
	 * @param foreignKeys Array donde se añadirán las restricciones (constraints) FOREIGN KEY.
	 * @param relationAttributes Array para almacenar atributos simples u opcionales que provengan del rombo de la relación.
	 * @param relationRestrictions Array para almacenar restricciones UNIQUE o CHECK provenientes de la relación.
	 * @param relationMultivalued Array que recopila el código SQL generado para los atributos multivaluados de la relación.
	 * @param root El modelo completo (GModel) para realizar búsquedas de otros nodos y aristas.
	 * @returns Un Set con los nombres de las tablas de las que depende esta entidad.
	 */
	static process11Relation(entity: Entity, relationNodes: RelationNodes, foreignColumns: string[], foreignKeys: string[], relationAttributes: string[], relationRestrictions: string[], relationMultivalued: string[], root: GModelElement) {
		const dependencies = new Set<string>();
		for (const relation of relationNodes.values()) {
			const is11 = relation.cardinality.includes("1:1") && relation.type === RELATION_TYPE;
			if (is11) {
				const [ceA, ceB] = relation.connectedEntities;
				const isAOptional = ceA.cardinalityText.includes("0");
				const isBOptional = ceB.cardinalityText.includes("0");

				let selected: { entity: GNode, participation: string };
				let other: GNode;

				if (!isAOptional && isBOptional) {                      // Selecciona participacion obligatoria
					selected = { entity: ceA.entity, participation: ceA.cardinalityText };
					other = ceB.entity;
				} else if (isAOptional && !isBOptional) {               // Selecciona participacion obligatoria
					selected = { entity: ceB.entity, participation: ceB.cardinalityText };
					other = ceA.entity;
				} else {
					// Si ambas son iguales (ambas 0:1 o ambas 1:1), usamos el ID como criterio de desempate
					const aMenor = ceA.entity.id < ceB.entity.id;
					selected = { entity: aMenor ? ceA.entity : ceB.entity, participation: aMenor ? ceA.cardinalityText : ceB.cardinalityText };
					other = aMenor ? ceB.entity : ceA.entity;
				}

				if (selected.entity.id === entity.node.id) {
					dependencies.add(SQLUtils.cleanNames(other));
					this.absorbRelation(relation, other, selected.participation, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);
				}
			}
		}
		return dependencies;
	}

	/**
	 * Procesa relaciones relaciones de dependencia en existencia -> la entidad debil siempre absorbe a la fuerte
	 * @param cardinality Cardinalidad del rombo de la relacion
	 * @param entity La entidad actual que se está transformando en tabla.
	 * @param relationNodes Mapa con todas las relaciones detectadas en el diagrama.
	 * @param foreignColumns Array donde se añadirán las definiciones de columnas de las claves foráneas.
	 * @param foreignKeys Array donde se añadirán las restricciones (constraints) FOREIGN KEY.
	 * @param relationAttributes Array para almacenar atributos simples u opcionales que provengan del rombo de la relación.
	 * @param relationRestrictions Array para almacenar restricciones UNIQUE o CHECK provenientes de la relación.
	 * @param relationMultivalued Array que recopila el código SQL generado para los atributos multivaluados de la relación.
	 * @param root El modelo completo (GModel) para realizar búsquedas de otros nodos y aristas.
	 * @returns Un Set con los nombres de las tablas de las que depende esta entidad.
	 */
	static processExistenceDependenceRelation(cardinality: string, entity: Entity, relationNodes: RelationNodes, foreignColumns: string[], foreignKeys: string[], relationAttributes: string[], relationRestrictions: string[], relationMultivalued: string[], root: GModelElement) {
		const dependencies = new Set<string>();
		for (const relation of relationNodes.values()) {
			const isExistence = relation.cardinality.includes(cardinality) && relation.type === EXISTENCE_DEP_RELATION_TYPE;
			if (isExistence) {
				const { sideNormal, sideWeak } = this.getSidesNormalAndWeak(relation);

				if (sideWeak && sideNormal && sideWeak.entity.id === entity.node.id) {
					dependencies.add(SQLUtils.cleanNames(sideNormal.entity));
					this.absorbRelation(relation, sideNormal.entity, sideNormal.cardinalityText, foreignColumns, foreignKeys, relationAttributes, relationRestrictions, relationMultivalued, root);
				}
			}
		}
		return dependencies;
	}

	/**
	 * Helper privado que centraliza la absorción de una relación en una tabla.
	 * @param relation La relación que se va a aplanar/absorber.
	 * @param sourceEntity La entidad de origen de la cual tomaremos la clave primaria.
	 * @param participation Texto de participación (ej. "0:1") para determinar la nulidad.
	 * @param foreignColumns Puntero al array de columnas de la tabla destino.
	 * @param foreignKeys Puntero al array de claves foráneas de la tabla destino.
	 * @param relationAttributes Puntero al array de atributos de la relación.
	 * @param relationRestrictions Puntero al array de restricciones de la relación.
	 * @param relationMultivalued Puntero al array de SQL para multivaluados.
	 * @param root Contexto del modelo.
	 */
	private static absorbRelation(relation: Relation, sourceEntity: GNode, participation: string, foreignColumns: string[], foreignKeys: string[], relationAttributes: string[], relationRestrictions: string[], relationMultivalued: string[], root: GModelElement) {
		const sourceName = SQLUtils.cleanNames(sourceEntity);

		// Este array guardará la configuración de cada columna de la FK
		const identityMapping: { localName: string, refName: string, type: string }[] = [];

		if (sourceEntity.type === WEAK_ENTITY_TYPE) {
			// 1. OBTENER IDENTIDAD DE ENTIDAD DÉBIL
			const { name: identifyingRelName, pks: parentPKs } = EntitiesTransformer.getFatherPKsFromWeakEntity(sourceEntity, root);

			// A) Parte de la identidad que viene del Padre (Ej: Consta_Cod_comunidad)
			parentPKs.forEach(pNode => {
				const { name, type } = SQLUtils.getNameAndType(pNode);
				const refColInSource = `${identifyingRelName}_${name}`; // Nombre real en la tabla debil
				const localColName = `${relation.name}_${refColInSource}`; // Nombre en la tabla que absorbe
				identityMapping.push({ localName: localColName, refName: refColInSource, type });
			});

			// B) Parte de la identidad que son discriminadores (Ej: Portal_disc)
			AttributeTransformer.transformSimple(sourceEntity, root).forEach(sNode => {
				const { name, type } = SQLUtils.getNameAndType(sNode);
				if (name.includes("_disc")) {
					identityMapping.push({
						localName: `${relation.name}_${name}`,
						refName: name,
						type
					});
				}
			});
		} else {
			// 2. OBTENER IDENTIDAD DE ENTIDAD NORMAL
			const fkNodes = AttributeTransformer.transformPKs(sourceEntity, root);
			fkNodes.forEach(pkNode => {
				const { name, type } = SQLUtils.getNameAndType(pkNode);
				identityMapping.push({
					localName: `${relation.name}_${name}`,
					refName: name,
					type
				});
			});
		}

		// 3. GENERAR COLUMNAS Y RESTRICCIÓN UNIQUE
		const isOptional = participation.includes("0") && relation.type !== EXISTENCE_DEP_RELATION_TYPE;
		const nullability = isOptional ? "NULL" : "NOT NULL";
		const uniqueConstraint = !relation.cardinality.includes("N") ? " UNIQUE" : "";

		identityMapping.forEach(col => {
			foreignColumns.push(`    ${col.localName} ${col.type} ${nullability}${uniqueConstraint}`);
		});

		// 4. GENERAR LA FOREIGN KEY UNIFICADA
		if (identityMapping.length > 0) {
			const localCols = identityMapping.map(m => m.localName).join(', ');
			const refCols = identityMapping.map(m => m.refName).join(', ');
			const cascade = (relation.type === EXISTENCE_DEP_RELATION_TYPE || sourceEntity.type === WEAK_ENTITY_TYPE)
				? " ON DELETE CASCADE" : "";

			foreignKeys.push(`    FOREIGN KEY (${localCols}) REFERENCES ${sourceName}(${refCols})${cascade}`);
		}

		// 5. PROCESAR ATRIBUTOS DEL ROMBO Y MULTIVALUADOS
		this.collectAndProcessRelationAttributes(relation, relationAttributes, relationRestrictions);
		relationMultivalued.push(...AttributeTransformer.processMultivaluedAttributes(relation.attributes.multiValued, relation.node, root));
	}

	/**
	 * Procesa dependencias en identificacion para entidades débiles.
	 * @param cardinality El tipo de cardinalidad a filtrar (ej. "1:N").
	 * @param entity La entidad débil que está siendo procesada.
	 * @param relationNodes Mapa de relaciones del modelo.
	 * @param foreignColumns Columnas que se añaden a la tabla (serán parte de la PK).
	 * @param pks Array que rastrea qué nombres de columnas forman la clave primaria de la tabla actual.
	 * @param relationAttributes Atributos que el rombo de la relación aporta a la tabla.
	 * @param relationRestrictions Restricciones adicionales del rombo.
	 * @param foreignKeys Restricciones FOREIGN KEY con ON DELETE CASCADE.
	 * @param relationMultivalued SQL para atributos multivaluados de la relación identificativa.
	 * @param root Modelo raíz para contexto.
	 */
	static processIdentifyingDependenceRelation(cardinality: string, entity: Entity, relationNodes: RelationNodes, foreignColumns: string[], pks: string[], relationAttributes: string[], relationRestrictions: string[], foreignKeys: string[], relationMultivalued: string[], root: GModelElement): Set<string> {
		const dependencies = new Set<string>();

		for (const relation of relationNodes.values()) {
			const isIdentifying = relation.cardinality.includes(cardinality) && relation.type === IDENTIFYING_DEP_RELATION_TYPE;

			if (isIdentifying) {
				// const { sideNormal, sideWeak } = this.getSidesNormalAndWeak(relation);

				const sideWeak = relation.connectedEntities.find(ce => ce.cardinalityText.toUpperCase().includes("N"));
				const sideNormal = relation.connectedEntities.find(ce => ce !== sideWeak);										// El padre es simplemente el OTRO lado (el que tiene cardinalidad 1)

				if (sideWeak && sideNormal && sideWeak.entity.id === entity.node.id) {
					const sourceName = SQLUtils.cleanNames(sideNormal.entity);
					dependencies.add(sourceName);

					// 1. MAPA DE IDENTIDAD PARA MULTIVALUADOS
					// Guardaremos aquí las columnas reales que identifican a la entidad débil
					const weakEntityFullIdentity: { node: GNode, tableName: string, colName: string }[] = [];

					// 2. PROCESAR PKs DEL PADRE (Se convierten en FKs y parte de la PK del hijo)
					// const sideNormalPK = AttributeTransformer.transformPKs(sideNormal.entity, root);

					// Si el padre es también una entidad débil, necesitamos TODA su identidad (Abuelo + Padre)
					let sideNormalPKs: GNode[] = [];
					if (sideNormal.entity.type === WEAK_ENTITY_TYPE) {
						// Obtenemos las PKs que el padre heredó de su propio padre (el abuelo)
						const { pks: inheritedFromGrandfather } = EntitiesTransformer.getFatherPKsFromWeakEntity(sideNormal.entity, root);
						sideNormalPKs = [...inheritedFromGrandfather];

						// Añadimos los discriminadores propios del padre
						AttributeTransformer.transformSimple(sideNormal.entity, root).forEach(attr => {
							if (SQLUtils.getNameAndType(attr).name.includes("_disc")) {
								sideNormalPKs.push(attr);
							}
						});
					} else {
						// Si el padre es fuerte, solo sus PKs normales
						sideNormalPKs = AttributeTransformer.transformPKs(sideNormal.entity, root);
					}

					sideNormalPKs.forEach(pk => {
						const { name, type } = SQLUtils.getNameAndType(pk);
						const localColName = `${relation.name}_${name}`;

						foreignColumns.push(`    ${localColName} ${type} NOT NULL`);
						pks.push(localColName); // Se añade a la PK de la tabla actual

						foreignKeys.push(`    FOREIGN KEY (${localColName}) REFERENCES ${sourceName}(${name}) ON DELETE CASCADE`);

						// Guardamos para los multivaluados: este valor apunta a la tabla del hijo (entity.name)
						weakEntityFullIdentity.push({
							node: pk,
							tableName: entity.name,
							colName: localColName
						});
					});

					// 3. IDENTIFICAR DISCRIMINADORES DE LA ENTIDAD DÉBIL
					AttributeTransformer.transformSimple(entity.node, root).forEach(simple => {
						const { name } = SQLUtils.getNameAndType(simple);
						if (name.includes("_disc")) {
							// El discriminador NO se prefija porque es propio de la entidad débil
							pks.push(name);

							// Guardamos para los multivaluados
							weakEntityFullIdentity.push({
								node: simple,
								tableName: entity.name,
								colName: name
							});
						}
					});

					// 4. PROCESAR ATRIBUTOS DEL ROMBO
					// (Tu lógica de conversión de PK a UNIQUE es correcta)
					const { columnPKs: relPkCols, restriction: relPkRest } = AttributeTransformer.processPK(relation.attributes.pk);
					const { columns: relUniqueCols, restriction: relUniqueRest } = AttributeTransformer.processUnique(relation.attributes.unique);
					const relSimple = AttributeTransformer.processSimpleAttributes(relation.attributes.simple);
					const relOptional = AttributeTransformer.processOptionalAttributes(relation.attributes.optional);

					const cleanedRelPkCols = relPkCols.map(col => col.replace(" PRIMARY KEY", " UNIQUE"));
					const cleanedRelPkRest = relPkRest.map(rel => rel.replace("PRIMARY KEY", "UNIQUE"));

					relationAttributes.push(...cleanedRelPkCols, ...relUniqueCols, ...relSimple, ...relOptional);
					if (cleanedRelPkRest) relationRestrictions.push(...cleanedRelPkRest);
					if (relUniqueRest) relationRestrictions.push(...relUniqueRest);

					// 5. CONFIGURAR MULTIVALUADOS DEL ROMBO
					// Los multivaluados de una relación identificativa deben apuntar a la PK compuesta del hijo
					relation.attributes.multiValued.forEach(mv => {
						mv.parentPKs = weakEntityFullIdentity; // Le pasamos el mapa completo de (Padre_PK + Discriminadores)
						mv.parentName = entity.name;
					});

					// Generar los SQL de las tablas multivaluadas
					const mvTables = AttributeTransformer.processMultivaluedAttributes(relation.attributes.multiValued, relation.node, root);
					relationMultivalued.push(...mvTables);
				}
			}
		}
		return dependencies;
	}

	/**
	 * Helper para identificar los lados Normal (Fuerte) y Débil de una relación.
	 */
	private static getSidesNormalAndWeak(relation: Relation) {
		if (relation.isReflexive) {
			return { sideNormal: relation.connectedEntities[0], sideWeak: relation.connectedEntities[1] };
		}
		return {
			sideNormal: relation.connectedEntities.find((ce: any) => ce.entity.type === ENTITY_TYPE),
			sideWeak: relation.connectedEntities.find((ce: any) => ce.entity.type === WEAK_ENTITY_TYPE)
		};
	}

	/**
	 * Procesa atributos de una relación (PKs, Uniques, Simples) y los prepara para ser insertados en una tabla.
	 */
	private static collectAndProcessRelationAttributes(relation: any, attrList: string[], restList: string[]) {
		const simple = AttributeTransformer.processSimpleAttributes(relation.attributes.simple);
		const optional = AttributeTransformer.processOptionalAttributes(relation.attributes.optional);
		const { columns: uniques, restriction: uniqueRest } = AttributeTransformer.processUnique(relation.attributes.unique);

		// Las PKs de una relación absorbida se convierten en restricciones UNIQUE
		const { columnPKs: pks, restriction: pkRest } = AttributeTransformer.processPK(relation.attributes.pk);
		const cleanedPks = pks.map(col => col.replace(" PRIMARY KEY", " UNIQUE"));
		const cleanedPkRest = pkRest.map(rel => rel.replace("PRIMARY KEY", "UNIQUE"));

		attrList.push(...cleanedPks, ...uniques, ...simple, ...optional);
		restList.push(...cleanedPkRest, ...uniqueRest);
	}

}