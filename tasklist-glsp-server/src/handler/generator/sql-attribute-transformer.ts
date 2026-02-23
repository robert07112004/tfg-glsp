import { GEdge, GModelElement, GNode } from '@eclipse-glsp/server';
import { ALTERNATIVE_KEY_ATTRIBUTE_TYPE, ATTRIBUTE_TYPE, DEFAULT_EDGE_TYPE, ENTITY_TYPE, EXISTENCE_DEP_RELATION_TYPE, IDENTIFYING_DEP_RELATION_TYPE, KEY_ATTRIBUTE_TYPE, MULTI_VALUED_ATTRIBUTE_TYPE, OPTIONAL_EDGE_TYPE, RELATION_TYPE, WEIGHTED_EDGE_TYPE } from '../validation/utils/validation-constants';
import { AllAttributes, Multivalued } from './sql-interfaces';
import { RelationsTransformer } from './sql-relations-transformer';
import { SQLUtils } from './sql-utils';

export class AttributeTransformer {

    /*
     * Entrada -> GNode[]
     * Salida -> { columnPKs: string[], restriction: string[] }
     * Dependiendo de si el array pks tiene un elemento o varios, devuelve el string de una manera o de otra
     * Si tiene un elemento, devuelve el string como NOT NULL PRIMARY KEY en columnPKs y restriction vacio
     * Si tiene varios elementos, devuelve por cada elemento su columnPK sin PRIMARY KEY y en restriction
     * devuelve PRIMARY KEY (todos los nombres de pks)
     */
    static processPK(pks: GNode[]): { columnPKs: string[], restriction: string[] } {
        let columnPKs: string[] = [];
        let restriction: string[] = [];

        if (pks.length === 1) {
            const { name, type } = SQLUtils.getNameAndType(pks[0]);
            columnPKs = [`    ${name} ${type} NOT NULL PRIMARY KEY`];
        } else if (pks.length > 1) {
            const names: string[] = []
            for (const pk of pks) {
                const { name, type } = SQLUtils.getNameAndType(pk);
                columnPKs.push(`    ${name} ${type} NOT NULL`);
                names.push(name);
            }
            restriction = [`    PRIMARY KEY (${names.join(', ')})`];
        }
        return { columnPKs, restriction };
    }

    /*
     * Entrada -> array de objetos { isNullable: boolean, nodes: GNode[] }[]
     * Salida -> { columns: string[], restriction: string[] } 
     * Recorremos los objetos y dependiendo de cuantos elementos tenga nodes, se hace una cosa u otra
     * Si solo tiene un elemnento, entonces se pone el elemento en columns con un UNIQUE
     * Si tiene mas de un elemento, se recorren todos los elementos y se van añadiendo en columns sin UNIQUE,
     * luego en restriction se devuelve UNIQUE(todos los nombres)
     */
    static processUnique(uniques: { isNullable: boolean, nodes: GNode[] }[]): { columns: string[], restriction: string[] } {
        let columns: string[] = [];
        let restriction: string[] = [];
        for (const unique of uniques) {
            if (unique.nodes.length === 1) {
                const { name, type } = SQLUtils.getNameAndType(unique.nodes[0]);
                const nullability = unique.isNullable ? "NULL" : "NOT NULL";
                columns.push(`    ${name} ${type} ${nullability} UNIQUE`);
            } else if (unique.nodes.length > 1) {
                const names: string[] = [];
                for (const node of unique.nodes) {
                    const { name, type } = SQLUtils.getNameAndType(node);
                    const nullability = unique.isNullable ? "NULL" : "NOT NULL";
                    columns.push(`    ${name} ${type} ${nullability}`);
                    names.push(name);
                }
                restriction.push(`    UNIQUE (${names.join(', ')})`);
            }
        }
        return { columns, restriction };
    }

    /*
     * Entrada -> GNode[]
     * Salida -> string[]
     * Se recorren todos los atributos y se van añadiendo al string final con un NOT NULL
     */
    static processSimpleAttributes(attributes: GNode[]): string[] {
        let columns: string[] = [];
        for (const attribute of attributes) {
            const { name, type } = SQLUtils.getNameAndType(attribute);
            columns.push(`    ${name} ${type} NOT NULL`);
        }
        return columns;
    }

    /*
     * Entrada -> GNode[]
     * Salida -> string[]
     * Se recorren todos los atributos y se van añadiendo al string final con un NULL
     */
    static processOptionalAttributes(optionalAttributes: GNode[]): string[] {
        let columns: string[] = [];
        for (const optionalAttribute of optionalAttributes) {
            const { name, type } = SQLUtils.getNameAndType(optionalAttribute);
            columns.push(`    ${name} ${type} NULL`);
        }
        return columns;
    }

    /*
     * Entrada -> Multivalued[], parentNode (GNode), root (GModelElement)
     * Salida -> string[]
     */
    static processMultivaluedAttributes(multivaluedAttributes: Multivalued[], parentNode: GNode, root: GModelElement): string[] {
        let resultString: string[] = [];
        if (!multivaluedAttributes) return [];

        // Recorremos todos los objetos Multivalued
        for (const multivalued of multivaluedAttributes) {
            let tableLines: string[] = [];
            let pks: string[] = [];             // Son las PKs de la tabla del multivaluado
            let onlyParentFKs: string[] = [];   // Se utilizara para las FK de la tabla del multivaluado
            let tableName = `${multivalued.parentName}_${multivalued.name}`;    // Nombre de la tabla -> nombrePadreDelMultivaluado_nombreMultivalaudo
            let sql = `CREATE TABLE ${tableName} (\n`;

            // Recorremos todas las PKs del padre del multivaluado
            multivalued.parentPKs.forEach(pkData => {
                const { name: _, type: type } = SQLUtils.getNameAndType(pkData.node);
                tableLines.push(`    ${pkData.colName} ${type} NOT NULL`);              // Guardamos como columnas
                pks.push(pkData.colName);                                               // Guardamos como PKs compuesta con selfNode
                onlyParentFKs.push(pkData.colName);                                     // Guardamos como FKs
            });

            // Recorremos todos los nodos del multivaluado
            multivalued.selfNode.forEach(mv => {
                const { name, type } = SQLUtils.getNameAndType(mv);
                tableLines.push(`    ${name} ${type} NOT NULL`);                        // Guardamos como columnas
                pks.push(name);                                                         // Guardamos como PKs compuesta con parentPKs
            });

            tableLines.push(`    PRIMARY KEY (${pks.join(', ')})`);                     // Añadimos a tableLines las PK compuestas (parentPKs + mv)

            // Añadimos a tableLines las FK dependiendo de como sea la relacion
            if (parentNode.type === IDENTIFYING_DEP_RELATION_TYPE) {
                // Si es en identificacion, juntamos las parentPks en un string     -->     FOREIGN KEY (col1, col2) REFERENCES nombrePadre(col1, col2) ON DELETE CASCADE
                const cols = multivalued.parentPKs.map(p => p.colName).join(', ');
                const parentName = multivalued.parentPKs[multivalued.parentPKs.length - 1].tableName;
                tableLines.push(`    FOREIGN KEY (${cols}) REFERENCES ${parentName}(${cols}) ON DELETE CASCADE`)
            } else if (RelationsTransformer.isReflexive(parentNode, root) && SQLUtils.getCardinality(parentNode).includes("N:M")) {
                // Si es N:M reflexiva hay que quitar los sufijos _1, _2
                multivalued.parentPKs.forEach(pkData => {
                    let newColName = pkData.colName;
                    if (pkData.colName[pkData.colName.length - 1].includes("1") || pkData.colName[pkData.colName.length - 1].includes("2")) newColName = pkData.colName.slice(0, -2);
                    tableLines.push(`    FOREIGN KEY (${pkData.colName}) REFERENCES ${pkData.tableName}(${newColName}) ON DELETE CASCADE`);
                });
            } else {
                // Para el resto se pone la FK directamente con los parentPKs juntos
                const cols = multivalued.parentPKs.map(p => p.colName).join(', ');
                const parentName = multivalued.parentPKs[0].tableName;
                tableLines.push(`    FOREIGN KEY (${cols}) REFERENCES ${parentName}(${cols}) ON DELETE CASCADE`);
            }

            sql += tableLines.join(",\n");
            sql += "\n);\n\n";

            resultString.push(sql);
        }

        return resultString;
    }

    /*
     * Entrada -> entity (GNode), root (GModelElement)
     * Salida -> AllAttributes
     * Devuelve todos los tipos de atributos que tiene un componente (entidad, relacion, etc)
     */
    static getAllAttributes(entity: GNode, root: GModelElement): AllAttributes {
        const processedIds = new Set<string>();

        const pk = this.transformPKs(entity, root);
        pk.forEach(n => processedIds.add(n.id));

        const unique = this.transformUnique(entity, root);
        unique.forEach(group => {
            group.nodes.forEach(n => processedIds.add(n.id));
        });

        const simple = this.transformSimple(entity, root)
            .filter(n => !processedIds.has(n.id));
        simple.forEach(n => processedIds.add(n.id));

        const optional = this.transformOptionals(entity, root)
            .filter(n => !processedIds.has(n.id));

        return {
            pk,
            unique,
            simple,
            optional,
            multiValued: this.transformMultivalued(entity, root)
        };
    }

    /*
     * Entrada -> entidad (GNode), root (GModelElement)
     * Salida -> GNode[]
     * Guardo en una array todos los edges que salen de la entidad y que son transition-edge
     * Recorro ese array de edges
     * Por cada edge que recorro miro su parte final (el atributo) y veo si es de tipo clave primaria
     * Si es clave primaria lo guardo en mi array de pks y se devuelve al final de la funcion
     */
    static transformPKs(entity: GNode, root: GModelElement): GNode[] {
        const pks: GNode[] = [];
        const edges = root.children.filter(child => child instanceof GEdge && child.type === DEFAULT_EDGE_TYPE && child.sourceId === entity.id) as GEdge[];
        for (const edge of edges) {
            const node = SQLUtils.findById(edge.targetId, root) as GNode;
            if (node.type === KEY_ATTRIBUTE_TYPE) pks.push(node);
        }
        return pks;
    }

    /*
     * Entrada -> entidad (GNode), root (GModelElement)
     * Salida -> array de objetos { isNullable: boolean, nodes: GNode[] }[]
     * Guardo en un array todos los edges que salen de la entidad y que son transition-edge o optional-edge
     * Recorro ese array de edges
     * Por cada edge que recorro miro su parte final (el atributo) y veo si es de tipo clave alternativa
     * Si es clave alternativa entonces se mira a ver si es unique compuesto
     * En el caso de que lo sea, se van recorriendo las aristas del atributo en el que estamos y se miran la parte del final de las aristas
     * En el caso contrario, se hace un push directamente del atributo unique con su arista
     */
    static transformUnique(entity: GNode, root: GModelElement): { isNullable: boolean, nodes: GNode[] }[] {
        const uniques: { isNullable: boolean, nodes: GNode[] }[] = [];
        const edges = root.children.filter(child => child instanceof GEdge &&
            (child.type === DEFAULT_EDGE_TYPE || child.type === OPTIONAL_EDGE_TYPE) &&
            child.sourceId === entity.id) as GEdge[];
        for (const edge of edges) {
            const node = SQLUtils.findById(edge.targetId, root) as GNode;
            if (node.type === ALTERNATIVE_KEY_ATTRIBUTE_TYPE) {
                const compositeUniques: GNode[] = [];
                const isOptional: boolean = edge.type === OPTIONAL_EDGE_TYPE;
                const compositeUniquesEdges: GEdge[] = root.children.filter(child => child instanceof GEdge &&
                    (child.type === DEFAULT_EDGE_TYPE || child.type === OPTIONAL_EDGE_TYPE) &&
                    child.sourceId === node.id) as GEdge[];
                if (compositeUniquesEdges.length !== 0) {
                    for (const compositeUniqueEdge of compositeUniquesEdges) {
                        const nodeComposite: GNode = SQLUtils.findById(compositeUniqueEdge.targetId, root) as GNode;
                        compositeUniques.push(nodeComposite);
                    }
                    uniques.push({ isNullable: isOptional, nodes: compositeUniques });
                } else uniques.push({ isNullable: isOptional, nodes: [node] });
            }
        }
        return uniques;
    }

    /*
     * Entrada -> entidad (GNode), root (GModelElement)
     * Salida -> GNode[]
     * Guardo en un array todos los edges que salen de la entidad y que son transition-edge
     * Recorro ese array de edges
     * Por cada edge que recorro miro su parte final (el atributo) y veo si es de tipo atributo normal
     * Miro a ver si tiene atributos compuestos y los voy guardando
     * En el caso de que no sea compuesto se hace un push directamente al array de GNodes
     */
    static transformSimple(entity: GNode, root: GModelElement): GNode[] {
        const attributes: GNode[] = [];
        const edges: GEdge[] = root.children.filter(child => child instanceof GEdge && child.sourceId === entity.id && child.type !== OPTIONAL_EDGE_TYPE) as GEdge[];
        for (const edge of edges) {
            const node: GNode = SQLUtils.findById(edge.targetId, root) as GNode;
            if (node.type === ATTRIBUTE_TYPE) {
                const compositeAttributeEdges: GEdge[] = root.children.filter(child => child instanceof GEdge && child.sourceId === node.id) as GEdge[];
                if (compositeAttributeEdges.length !== 0) {
                    for (const compositeAttributeEdge of compositeAttributeEdges) {
                        const compositeAttribute: GNode = SQLUtils.findById(compositeAttributeEdge.targetId, root) as GNode;
                        attributes.push(compositeAttribute);
                    }
                } else attributes.push(node);
            }
        }
        return attributes;
    }

    /*
     * Entrada -> entidad (GNode), root (GModelElement)
     * Salida -> GNode[]
     * Guardo en un array todos los edges que salen de la entidad y que son optional-edges
     * Recorro ese array de edges
     * Por cada edge que recorro miro su parte final (el atributo) y veo si es de tipo atributo normal
     * Miro a ver si tiene atributos compuestos y los voy guardando
     * En el caso de que no sea compuesto se hace un push directamente al array de GNodes
     */
    static transformOptionals(entity: GNode, root: GModelElement): GNode[] {
        const optionalAttributes: GNode[] = [];
        const edges: GEdge[] = root.children.filter(child => child instanceof GEdge && child.sourceId === entity.id && child.type === OPTIONAL_EDGE_TYPE) as GEdge[];
        for (const edge of edges) {
            const node: GNode = SQLUtils.findById(edge.targetId, root) as GNode;
            const compositeAttributeEdges: GEdge[] = root.children.filter(child => child instanceof GEdge && child.sourceId === node.id) as GEdge[];
            if (compositeAttributeEdges.length !== 0) {
                for (const compositeAttributeEdge of compositeAttributeEdges) {
                    const compositeAttribute: GNode = SQLUtils.findById(compositeAttributeEdge.targetId, root) as GNode;
                    optionalAttributes.push(compositeAttribute);
                }
            } else optionalAttributes.push(node);
        }
        return optionalAttributes;
    }

    /*
     * Entrada -> entidad (GNode), root (GModelElement)
     * Salida -> Multivalued[]
     */

    /*
     *   export interface Multivalued {
     *       name: string,
     *       parentName: string,
     *       parentPKs: { node: GNode, tableName: string, colName: string }[],
     *       selfNode: GNode[]
     *   }
     */
    static transformMultivalued(node: GNode, root: GModelElement): Multivalued[] {
        const multivalued: Multivalued[] = [];
        let parentPKs: { node: GNode, tableName: string, colName: string }[] = [];

        // Recorremos todas las edges que salen de la entidad
        const edges = root.children.filter(child => child instanceof GEdge && child.sourceId === node.id) as GEdge[];

        // Si el nodo es una entidad hay que encontrar sus PKs y guardarlas en el objeto
        if (node.type === ENTITY_TYPE) parentPKs = AttributeTransformer.transformPKs(node, root)
            .map(pk => (
                {
                    node: pk,
                    tableName: SQLUtils.cleanNames(node),
                    colName: SQLUtils.getNameAndType(pk).name
                }
            ));

        // Si el nodo es un tipo de relacion, entonces sacamos la cardinalidad de la relacion y dependiendo del tipo se hace algo
        else if (node.type === RELATION_TYPE || node.type === EXISTENCE_DEP_RELATION_TYPE || node.type === IDENTIFYING_DEP_RELATION_TYPE) {
            const cardinality = SQLUtils.getCardinality(node);

            // N:M -> se sacan las PKs del rombo
            if (cardinality.includes("N:M")) {
                const relPKs = AttributeTransformer.transformPKs(node, root);

                // Tiene PKs -> se mapean las pks para crear el objeto con el nodo, tableName, colName
                if (relPKs.length > 0) {
                    parentPKs = relPKs.map(pk => ({ node: pk, tableName: SQLUtils.cleanNames(node), colName: SQLUtils.getNameAndType(pk).name }));
                }

                // No tiene PKs -> se llega a las entidades conectadas y se sacan sus PKs, luego se van concatenando los objetos a parentPKs
                else {
                    const connectedEdges = root.children.filter(child => child instanceof GEdge &&
                        child.type === WEIGHTED_EDGE_TYPE &&
                        child.targetId === node.id) as GEdge[];
                    for (const edge of connectedEdges) {
                        const entity = SQLUtils.findById(edge.sourceId, root) as GNode;
                        if (entity && entity.type === ENTITY_TYPE) {
                            const entityPKs = AttributeTransformer.transformPKs(entity, root).map(pk => ({ node: pk, tableName: SQLUtils.cleanNames(entity), colName: SQLUtils.getNameAndType(pk).name }));
                            parentPKs = [...parentPKs, ...entityPKs];
                        }
                    }
                }

                // 1:N -> se guarda la weighted-edge del rombo que contiene la "..N" y se encuentra la entidad. Posteriormente, se sacan sus PKs
            } else if (cardinality.includes("1:N")) {
                const edgeN = root.children.find(child => child instanceof GEdge && child.targetId === node.id && SQLUtils.getCardinality(child).includes("N")) as GEdge;
                const entity = SQLUtils.findById(edgeN.sourceId, root) as GNode;
                parentPKs = AttributeTransformer.transformPKs(entity, root).map(pk => ({ node: pk, tableName: SQLUtils.cleanNames(entity), colName: SQLUtils.getNameAndType(pk).name }));

                // 1:1 -> se guardan las weighted-edge conectadas al rombo
            } else if (cardinality.includes("1:1")) {
                const connectedEdges: GEdge[] = root.children.filter(child => child instanceof GEdge &&
                    child.type === WEIGHTED_EDGE_TYPE &&
                    child.targetId === node.id) as GEdge[];
                if (connectedEdges.length === 2) {
                    const leftEdge = connectedEdges[0];
                    const rightEdge = connectedEdges[1];

                    // Se guardan las entidades de cada arista
                    const leftEntity = SQLUtils.findById(leftEdge.sourceId, root) as GNode;
                    const rightEntity = SQLUtils.findById(rightEdge.sourceId, root) as GNode;

                    // Se guardan la opcionalidad de cada arista
                    const leftIsOptional = SQLUtils.getCardinality(leftEdge).includes("0");
                    const rightIsOptional = SQLUtils.getCardinality(rightEdge).includes("0");

                    let selectedEntity: GNode;

                    // Se escoge la entidad que no sea opcional, en cualquier otro caso al azar
                    if (!leftIsOptional && rightIsOptional) selectedEntity = leftEntity;
                    else if (leftIsOptional && !rightIsOptional) selectedEntity = rightEntity;
                    else selectedEntity = leftEntity.id < rightEntity.id ? leftEntity : rightEntity;

                    // Se sacan las PKs de la entidad elegida
                    parentPKs = AttributeTransformer.transformPKs(selectedEntity, root).map(pk => ({ node: pk, tableName: SQLUtils.cleanNames(selectedEntity), colName: SQLUtils.getNameAndType(pk).name }));
                }
            }
        }

        // Una vez ya obtenido el objeto parentPKs nos centramos en la obtencion del atributo multivaluado
        // Buscamos el atributo multivaluado conectado a la entidad y miramos tambien si es compuesto
        // Finalmente, se crea el objeto Multivalued
        for (const edge of edges) {
            const mvNode = SQLUtils.findById(edge.targetId, root) as GNode;
            if (mvNode && mvNode.type === MULTI_VALUED_ATTRIBUTE_TYPE) {
                const selfNodes = this.getCompositeNodes(mvNode, root);
                multivalued.push({
                    name: SQLUtils.getNameAndType(mvNode).name,
                    parentName: SQLUtils.cleanNames(node),
                    parentPKs: parentPKs,
                    selfNode: selfNodes
                });
            }
        }

        return multivalued;
    }

    // Devuelve array de nodos
    // Si el multivaluado es compuesto, devuelve sus nodos finales, mientras que si no es compuesto lo devuelve en forma de array
    private static getCompositeNodes(attrNode: GNode, root: GModelElement): GNode[] {
        const childEdges = root.children.filter(c => c instanceof GEdge && c.sourceId === attrNode.id) as GEdge[];
        if (childEdges.length > 0) return childEdges.map(edge => SQLUtils.findById(edge.targetId, root) as GNode);
        return [attrNode];
    }

}