import {
    AbstractModelValidator,
    DefaultTypes,
    GEdge,
    GModelElement,
    GNode,
    Marker,
    MarkerKind
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../model/tasklist-model-index';
import { TaskListModelState } from '../model/tasklist-model-state';

@injectable()
export class TaskListModelValidator extends AbstractModelValidator {
    
    @inject(TaskListModelState)
    protected readonly modelState: TaskListModelState;

    protected get index(): TaskListModelIndex {
        return this.modelState.index as TaskListModelIndex;
    }

    protected readonly ENTITY_TYPE = DefaultTypes.NODE_RECTANGLE;
    protected readonly WEAK_ENTITY_TYPE = 'node:weakEntity';
    protected entityTypes = [
        this.ENTITY_TYPE,
        this.WEAK_ENTITY_TYPE
    ];

    protected readonly RELATION_TYPE = DefaultTypes.NODE_DIAMOND;
    protected readonly EXISTENCE_DEP_RELATION_TYPE = 'node:existenceDependentRelation';
    protected readonly IDENTIFYING_DEP_RELATION_TYPE = 'node:identifyingDependentRelation';
    protected readonly PARTIAL_EXCLUSIVE_SPECIALIZATION_TYPE = 'node:partialExclusiveSpecialization';
    protected readonly TOTAL_EXCLUSIVE_SPECIALIZATION_TYPE = 'node:totalExclusiveSpecialization';
    protected readonly PARTIAL_OVERLAPPED_SPECIALIZATION_TYPE = 'node:partialOverlappedSpecialization';
    protected readonly TOTAL_OVERLAPPED_SPECIALIZATION_TYPE = 'node:totalOverlappedSpecialization';
    protected relationTypes = [
        this.RELATION_TYPE,
        this.EXISTENCE_DEP_RELATION_TYPE,
        this.IDENTIFYING_DEP_RELATION_TYPE,
        this.PARTIAL_EXCLUSIVE_SPECIALIZATION_TYPE,
        this.TOTAL_EXCLUSIVE_SPECIALIZATION_TYPE,
        this.PARTIAL_OVERLAPPED_SPECIALIZATION_TYPE,
        this.TOTAL_OVERLAPPED_SPECIALIZATION_TYPE
    ];

    protected readonly ATTRIBUTE_TYPE = 'node:attribute';
    protected readonly KEY_ATTRIBUTE_TYPE = 'node:keyAttribute';
    protected readonly MULTI_VALUED_ATTRIBUTE_TYPE = 'node:multiValuedAttribute';
    protected readonly DERIVED_ATTRIBUTE_TYPE = 'node:derivedAttribute';
    protected attributeTypes = [
        this.ATTRIBUTE_TYPE,
        this.KEY_ATTRIBUTE_TYPE,
        this.MULTI_VALUED_ATTRIBUTE_TYPE,
        this.DERIVED_ATTRIBUTE_TYPE
    ];

    protected readonly DEFAULT_EDGE_TYPE = DefaultTypes.EDGE;
    protected readonly WEIGHTED_EDGE_TYPE = 'edge:weighted';
    protected readonly OPTIONAL_EDGE_TYPE = 'edge:optional';
    protected edgeTypes = [
        this.DEFAULT_EDGE_TYPE,
        this.WEIGHTED_EDGE_TYPE,
        this.OPTIONAL_EDGE_TYPE
    ];

    protected readonly MarkerKind = {
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    }

    protected readonly validationMap = new Map<string, (node: GNode) => Marker | undefined>([
        [this.ENTITY_TYPE, this.validateEntity],
        [this.WEAK_ENTITY_TYPE, this.validateWeakEntity],
        [this.RELATION_TYPE, this.validateRelation],
        [this.ATTRIBUTE_TYPE, this.validateAttribute],
        [this.KEY_ATTRIBUTE_TYPE, this.validateKeyAttribute],
        [this.DERIVED_ATTRIBUTE_TYPE, this.validatDerivedAttribute],
        [this.MULTI_VALUED_ATTRIBUTE_TYPE, this.validateMultiValuedAttribute],
        [this.EXISTENCE_DEP_RELATION_TYPE, this.validateExistenceDependenceRelation],
        [this.IDENTIFYING_DEP_RELATION_TYPE, this.validateIdentifyingDependenceRelation]
    ]);

    override doBatchValidation(element: GModelElement): Marker[] {
        if (!(element instanceof GNode)) {
            return [];
        }
        const validator = this.validationMap.get(element.type);
        if (validator) {
            const marker = validator.call(this, element);
            return marker ? [marker] : [];
        }
        return [];
    }

    protected getConnectedNeighbors(node: GNode): { otherNode: GNode, edge: GEdge }[] {
        const connectedEdges = [
            ...this.index.getIncomingEdges(node),
            ...this.index.getOutgoingEdges(node)
        ];
        const neighbors: { otherNode: GNode, edge: GEdge }[] = [];
        for (const edge of connectedEdges) {
            const otherNodeId = (edge.sourceId === node.id) ? edge.targetId : edge.sourceId;
            const otherNode = this.index.get(otherNodeId);
            if (otherNode && otherNode instanceof GNode) {
                neighbors.push({ otherNode, edge });
            }
        }
        return neighbors;
    }

    protected createMarker(kind: string, description: string, elementId: string, label: string): Marker {
        return { kind, description, elementId, label };
    }

    /* Entity rules:
     * Entity is not connected to anything.
     * Entity is connected to another entity.
     * Entity is not connected to another relation.
     * Entity connected to a relation without a weighted edge.
     * Entity is not connected to an atribute.
     * Entity is not connected to a key attribute but has attributes.
     */
    protected validateEntity(entityNode: GNode): Marker | undefined {
        const neighbors = this.getConnectedNeighbors(entityNode);

        if (neighbors.length === 0) {
            return this.createMarker(MarkerKind.ERROR, 'Entidad aislada', entityNode.id, 'ERR: sin conectar al modelo');
        }

        let isConnectedToEntity = false;
        let isConnectedToRelation = false;
        let isConnectedToRelationWithWeightedEdge = false;
        let isConnectedToAttribute = false;
        let isConnectedToKeyAttribute = false;

        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            if (this.entityTypes.includes(nodeType)) {
                isConnectedToEntity = true;
            }
            if (this.relationTypes.includes(nodeType)) {
                isConnectedToRelation = true;
                if (edge.type === this.WEIGHTED_EDGE_TYPE) {
                    isConnectedToRelationWithWeightedEdge = true;
                }
            }
            if (this.attributeTypes.includes(nodeType)) {
                isConnectedToAttribute = true;
                if (nodeType === this.KEY_ATTRIBUTE_TYPE) {
                    isConnectedToKeyAttribute = true;
                }
            }
        }

        if (isConnectedToEntity) {
            return this.createMarker(MarkerKind.ERROR, 'Entidad conectada con otra entidad', entityNode.id, 'ERR: entidad-entidad');
        }

        if (!isConnectedToRelation) {
            return this.createMarker(MarkerKind.ERROR, 'Entidad no conectada a ninguna relación', entityNode.id, 'ERR: entidad-sinRelación');
        }
        
        if (!isConnectedToRelationWithWeightedEdge) {
            return this.createMarker(MarkerKind.ERROR, 'Entidad no conectada a ninguna relación con una arista ponderada', entityNode.id, 'ERR: entidad-sinRelación-aristaPonderada');
        }

        if (!isConnectedToAttribute) {
            return this.createMarker(MarkerKind.WARNING, 'Entidad no conectada a ningún atributo', entityNode.id, 'ERR: entidad-sinAtributo');
        }
        
        if (!isConnectedToKeyAttribute) {
            return this.createMarker(MarkerKind.ERROR, 'Entidad no conectada a ningún atributo que sea una clave primaria', entityNode.id, 'ERR: entidad-sinClavePrimaria');
        }

        return undefined;
    }

    /* Weak entity rules:
     * Weak entity not connected to anything.
     * Must be connected to an existence dependent relation or an identifying dependent relation with a weighted edge.
     * Must be connected to a normal entity through an existence or identifying dependent relation.
     * If is connected to an existence relation must have a primary key.
     * If is connected to an identifying relation cant have a primary key.
     */
    protected validateWeakEntity(weakEntityNode: GNode): Marker | undefined {
        const neighbors = this.getConnectedNeighbors(weakEntityNode);

        if (neighbors.length === 0) {
            return this.createMarker(MarkerKind.ERROR, 'Entidad débil aislada', weakEntityNode.id, 'ERR: weakEntity-isolated');
        }

        let hasPrimaryKey = false;
        let hasAnyAttribute = false;
        let connectedToExistenceDep = false;
        let connectedToIdentifyingDep = false;
        let connectedToStrongEntityViaDep = false;

        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            const edgeType = edge.type;

            if (this.attributeTypes.includes(nodeType)) {
                if (edgeType !== this.DEFAULT_EDGE_TYPE) {
                    return this.createMarker(MarkerKind.ERROR, 'Entidad débil no puede estar conectada a atributos mediante otro tipo de aristas que no sean transiciones.', weakEntityNode.id, 'ERR: weakEntity-noDependence-weightedEdge');
                }
                hasAnyAttribute = true;
                if (nodeType === this.KEY_ATTRIBUTE_TYPE) {
                    hasPrimaryKey = true;
                }
            } 
            else if (nodeType === this.EXISTENCE_DEP_RELATION_TYPE) {
                if (edgeType !== this.WEIGHTED_EDGE_TYPE) {
                    return this.createMarker(MarkerKind.ERROR, 'Entidad débil no está conectada a ninguna dependencia en existencia mediante aristas ponderadas.', weakEntityNode.id, 'ERR: weakEntity-noDependence');
                }
                connectedToExistenceDep = true;
                if (this.isRelationConnectedToStrongEntity(otherNode, weakEntityNode.id)) {
                    connectedToStrongEntityViaDep = true;
                }
            } 
            else if (nodeType === this.IDENTIFYING_DEP_RELATION_TYPE) {
                if (edgeType !== this.WEIGHTED_EDGE_TYPE) {
                    return this.createMarker(MarkerKind.ERROR, 'Entidad débil no está conectada a ninguna dependencia en identificacion mediante aristas ponderadas.', weakEntityNode.id, 'ERR: weakEntity-noDependence');
                }
                connectedToIdentifyingDep = true;
                if (this.isRelationConnectedToStrongEntity(otherNode, weakEntityNode.id)) {
                    connectedToStrongEntityViaDep = true;
                }
            }
        }

        if (!connectedToExistenceDep && !connectedToIdentifyingDep) {
            return this.createMarker(MarkerKind.ERROR, 'Entidad débil no está conectada a ninguna dependencia en existencia o identificación.', weakEntityNode.id, 'ERR: weakEntity-noDependence');
        }

        if (!connectedToStrongEntityViaDep) {
            return this.createMarker(MarkerKind.ERROR, 'Entidad débil no está conectada a ninguna entidad fuerte a través de su(s) relación(es) de dependencia.', weakEntityNode.id, 'ERR: weakEntity-noStrongEntity');
        }

        if (connectedToExistenceDep && !hasPrimaryKey) {
            return this.createMarker(MarkerKind.ERROR, 'Entidad débil conectada a una dependencia en existencia debe tener un atributo clave primaria.', weakEntityNode.id, 'ERR: weakEntity-existence-noPrimaryKey');
        }

        if (connectedToIdentifyingDep && hasPrimaryKey) {
            return this.createMarker(MarkerKind.ERROR, 'Entidad débil conectada a una dependencia en identificación no puede tener clave primaria propia (solo clave parcial).', weakEntityNode.id, 'ERR: weakEntity-identifying-hasPrimaryKey');
        }

        if (connectedToIdentifyingDep && !hasAnyAttribute) {
            return this.createMarker(MarkerKind.ERROR, 'Entidad débil con dependencia en identificación debe tener al menos un atributo (por ejemplo, clave parcial).', weakEntityNode.id, 'ERR: weakEntity-identifying-noAttributes');
        }

        return undefined;
    }

    protected isRelationConnectedToStrongEntity(dependenceNode: GNode, originatingWeakEntityId: string): boolean {
        const neighbors = this.getConnectedNeighbors(dependenceNode);
        for (const { otherNode, edge } of neighbors) {
            if (otherNode.id === originatingWeakEntityId) {
                continue;
            }
            if (otherNode.type === this.ENTITY_TYPE && edge.type === this.WEIGHTED_EDGE_TYPE) {
                return true;
            }
        }
        return false;
    }

    /* Relation rules:
     * Relation is not connected to anything.
     * Relation is connected to another relation.
     * Relation is not connected with weighted edges.
     * Relation is connected with key attribute.
     * Relation is connected with a weighted edge to an attribute.
     */
    protected validateRelation(relationNode: GNode): Marker | undefined {
        const neighbors = this.getConnectedNeighbors(relationNode);

        if (neighbors.length === 0) {
            return this.createMarker(MarkerKind.ERROR, 'Relación aislada', relationNode.id, 'ERR: sin conectar al modelo');
        }

        let isConnectedToRelation = false;
        let entityConnectionCount = 0;
        let weightedEntityConnectionCount = 0;
        let isConnectedToKeyAttribute = false;
        let isConnectedToAttributeWithWeightedEdge = false;

        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            const edgeType = edge.type;
            if (this.relationTypes.includes(nodeType)) {
                isConnectedToRelation = true;
            }
            else if (this.attributeTypes.includes(nodeType)) {
                if (nodeType === this.KEY_ATTRIBUTE_TYPE) {
                    isConnectedToKeyAttribute = true;
                }
                if (edgeType === this.WEIGHTED_EDGE_TYPE && nodeType !== this.KEY_ATTRIBUTE_TYPE) {
                    isConnectedToAttributeWithWeightedEdge = true;
                }
            }
            else if (this.entityTypes.includes(nodeType)) {
                entityConnectionCount++;
                if (edgeType === this.WEIGHTED_EDGE_TYPE) {
                    weightedEntityConnectionCount++;
                }
            }
        }
        
        if (isConnectedToRelation) {
            return this.createMarker(MarkerKind.ERROR, 'Relación está conectada a otra relación', relationNode.id, 'ERR: relación-relación');
        }

        if (weightedEntityConnectionCount !== entityConnectionCount) {
            return this.createMarker(MarkerKind.ERROR, 'Relación debe estar conectada a entidades mediante aristas ponderadas', relationNode.id, 'ERR: cardinalidad');
        }

        if (isConnectedToKeyAttribute) {
            return this.createMarker(MarkerKind.ERROR, 'Relación no puede estar conectada a un atributo con clave primaria', relationNode.id, 'ERR: relación-sinClavePrimaria');
        }
        
        if (isConnectedToAttributeWithWeightedEdge) {
            return this.createMarker(MarkerKind.ERROR, 'Relación no puede estar conectada a un atributo mediante una arista ponderada', relationNode.id, 'ERR: relación-Atributo-aristaPonderada');
        }

        return undefined;
        
    }

    /* Normal attribute rules:
     * Attribute not connected to anything.
     * Attribute can only be connected to the same type of attribute or an optional attribute (composite attribute).
     * If attribute is connected to other attributes it must be connected to an entity.
     * Attribute can be connected only to normal relations.
     * Attribute can't be connected to a weighted edge.
     */
    protected validateAttribute(attributeNode: GNode): Marker | undefined {
        const neighbors = this.getConnectedNeighbors(attributeNode);

        if (neighbors.length === 0) {
            return this.createMarker(MarkerKind.ERROR, 'Atributo aislado', attributeNode.id, 'ERR: sin conectar al modelo');
        }

        let isConnectedToEntity = false;
        let isConnectedToWeakEntity = false;
        let isConnectedToKeyAttribute = false;
        let isConnectedToOtherAttribute = false; 
        let isConnectedToOtherRelation = false;
        let compositeAttributeCount = 0;

        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            const edgeType = edge.type;

            if (edgeType === this.WEIGHTED_EDGE_TYPE) {
                return this.createMarker(MarkerKind.ERROR, 'Atributo no puede estar conectado a nada mediante una arista ponderada.', attributeNode.id, 'ERR: Atributo-aristaPonderada');
            }
            
            if (nodeType === this.ATTRIBUTE_TYPE || edgeType === this.OPTIONAL_EDGE_TYPE) {
                compositeAttributeCount++;
            } else if (nodeType === this.KEY_ATTRIBUTE_TYPE) {
                isConnectedToKeyAttribute = true;
                isConnectedToOtherAttribute = true;
            } else if (this.attributeTypes.includes(nodeType)) {
                isConnectedToOtherAttribute = true;
            } else if (this.relationTypes.includes(nodeType) && nodeType !== this.RELATION_TYPE) {
                isConnectedToOtherRelation = true;
            } else if (nodeType === this.ENTITY_TYPE) {
                isConnectedToEntity = true;
            } else if (nodeType === this.WEAK_ENTITY_TYPE) {
                isConnectedToWeakEntity = true;
            }
        }

        if ((isConnectedToEntity || isConnectedToWeakEntity) && isConnectedToKeyAttribute) {
            return this.createMarker(MarkerKind.ERROR, 'Atributo conectado a entidad (normal o débil) y a una clave primaria.', attributeNode.id, 'ERR: Atributo-entidad-clavePrimaria');
        }
        
        if (compositeAttributeCount == 0 && isConnectedToOtherAttribute) {
            return this.createMarker(MarkerKind.ERROR, 'Atributo normal solo puede conectarse a atributos normales u opcionales.', attributeNode.id, 'ERR: Atributo-atributoNormal-atributoOpcional');
        }

        if (isConnectedToOtherRelation) {
            return this.createMarker(MarkerKind.ERROR, 'Atributo normal solo puede conectarse a relaciones normales.', attributeNode.id, 'ERR: Atributo-relacion');
        }
        
        if (compositeAttributeCount > 0 && !isConnectedToEntity && !isConnectedToWeakEntity) {
            return this.createMarker(MarkerKind.ERROR, 'Atributo compuesto debe estar conectado a una entidad o entidad débil.', attributeNode.id, 'ERR: Atributo-entidad-entidadDebil');
        }

        return undefined;

    }

    /* Key attribute rules:
     * Key attribute not connected to anything.
     * Key attribute must be connected to another entity.
     * Key attribute can be composed with other normal attributes or optional attributes.
     * Key attribute can be connected to an identifying dependence relation.
     * Key attribute can't be connected to a weighted edge.
     * Key attribute can't be connected to an entity or an identifying relation with an optional edge used in an optional attribute.
     */
    protected validateKeyAttribute(keyAttributeNode: GNode): Marker | undefined {
        const neighbors = this.getConnectedNeighbors(keyAttributeNode);

        if (neighbors.length === 0) {
            return this.createMarker(MarkerKind.ERROR, 'Atributo clave aislado', keyAttributeNode.id, 'ERR: sin conectar al modelo');
        }

        let isConnectedToEntity = false; 
        let isConnectedToOtherAttribute = false; 
        let isConnectedToIdentifyingDep = false;
        let isConnectedToOtherRelation = false; 

        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            const edgeType = edge.type;

            if (edgeType === this.WEIGHTED_EDGE_TYPE) {
                return this.createMarker(MarkerKind.ERROR, 'Atributo clave no puede estar conectado a nada mediante una arista ponderada.', keyAttributeNode.id, 'ERR: Atributo-aristaPonderada');
            }

            if (edgeType === this.OPTIONAL_EDGE_TYPE && (this.entityTypes.includes(nodeType) || nodeType === this.IDENTIFYING_DEP_RELATION_TYPE)) {
                return this.createMarker(MarkerKind.ERROR, 'Atributo clave no puede conectarse a una entidad o dependencia con una arista opcional.', keyAttributeNode.id, 'ERR: AtributoClave-aristaOpcional');
            }

            if (this.entityTypes.includes(nodeType)) {
                isConnectedToEntity = true;
            } else if (this.attributeTypes.includes(nodeType)) {
                isConnectedToOtherAttribute = true;
            } else if (nodeType === this.IDENTIFYING_DEP_RELATION_TYPE) {
                isConnectedToIdentifyingDep = true;
            } else if (this.relationTypes.includes(nodeType)) {
                isConnectedToOtherRelation = true;
            }
        }

        if (!isConnectedToEntity) {
            return this.createMarker(MarkerKind.ERROR, 'Un atributo de clave primaria tiene que estar conectado a una entidad o a una entidad débil.', keyAttributeNode.id, 'ERR: atributoClavePrimaria-entidad-entidadDebil');
        }

        if (isConnectedToOtherAttribute) {
            return this.createMarker(MarkerKind.ERROR, 'Atributo clave solo puede conectarse a atributos normales u opcionales para formar un atributo compuesto.', keyAttributeNode.id, 'ERR: atributoClavePrimaria-atributoNormal-atributoOpcional');
        }

        if (isConnectedToOtherRelation && !isConnectedToIdentifyingDep) {
            return this.createMarker(MarkerKind.ERROR, 'Atributo clave solo puede conectarse a una dependencia de identificación.', keyAttributeNode.id, 'ERR: atributoClavePrimaria-dependenciaEnIdentificacion');
        }

        return undefined;
        
    }

    /* Derived attribute rules:
     * Derived attribute not connected to anything.
     * Derived attribute can be connected to another entity, relation, weak entity, specialization. But can't be connected to dependencies.
     * Derived attribute can't be connected to a weighted edge.
     */
    protected validatDerivedAttribute(derivedAttributeNode: GNode): Marker | undefined {
        const neighbors = this.getConnectedNeighbors(derivedAttributeNode);

        if (neighbors.length === 0) {
            return this.createMarker(MarkerKind.ERROR, 'Atributo derivado aislado', derivedAttributeNode.id, 'ERR: sin conectar al modelo');
        }

        let isConnectedToDependence = false;
        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            const edgeType = edge.type;
            
            if (edgeType === this.WEIGHTED_EDGE_TYPE) {
                return this.createMarker(MarkerKind.ERROR, 'Atributo derivado no puede estar conectado a nada mediante una arista ponderada.', derivedAttributeNode.id, 'ERR: Atributo-aristaPonderada');
            }

            if (nodeType === this.EXISTENCE_DEP_RELATION_TYPE || nodeType === this.IDENTIFYING_DEP_RELATION_TYPE) {
                isConnectedToDependence = true;
            }

        }

        if (isConnectedToDependence) {
            return this.createMarker(MarkerKind.ERROR, 'Atributo derivado no puede estar conectado a una dependencia.', derivedAttributeNode.id, 'ERR: atrbutoDerivado-dependencia');
        }

        return undefined;

    }

    /* 
     * Multi-valued attribute not connected to anything.
     * Multi-valued attribute can't be connected to an entity or relation with an optional edge.
     * Multi-valued attribute can't be connected to a weighted edge.
     */
    protected validateMultiValuedAttribute(multiValuedAttributeNode: GNode): Marker | undefined {
        const neighbors = this.getConnectedNeighbors(multiValuedAttributeNode);

        if (neighbors.length === 0) {
            return this.createMarker(MarkerKind.ERROR, 'Atributo multivaluado aislado', multiValuedAttributeNode.id, 'ERR: sin conectar al modelo');
        }

        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            const edgeType = edge.type;
            
            if (edgeType === this.WEIGHTED_EDGE_TYPE) {
                return this.createMarker(MarkerKind.ERROR, 'Atributo multivaluado no puede estar conectado a nada mediante una arista ponderada.', multiValuedAttributeNode.id, 'ERR: Atributo-multivaluado-aristaPonderada');
            }

            if (edgeType === this.OPTIONAL_EDGE_TYPE && (this.entityTypes.includes(nodeType) || this.relationTypes.includes(nodeType))) {
                return this.createMarker(MarkerKind.ERROR, 'Atributo multivaluado no puede estar conectado a una entidad o relacion mediante una arista opcional.', multiValuedAttributeNode.id, 'ERR: Atributo-multivaluado-aristaOpcional');
            }
        }

        return undefined;

    }

    /* Existence dependence relation rules:
     * Existence dependence relation not connected to anything.
     * Existence dependence relation must be connected to one entity and one weak entity with weighted edges.
     * Existence dependence relation can't be connected to attributes with weighted edges.
     * Existence dependence can't be connected to key attributes.
     */
    protected validateExistenceDependenceRelation(existenceDependenceRelationNode: GNode): Marker | undefined {
        const neighbors = this.getConnectedNeighbors(existenceDependenceRelationNode);

        if (neighbors.length === 0) {
            return this.createMarker(MarkerKind.ERROR, 'Dependencia en existencia aislada', existenceDependenceRelationNode.id, 'ERR: sin conectar al modelo');
        }

        let isConnectedToWeightedEdge = 0;
        let isConnectedToEntity = 0;
        let isConnectedToWeakEntity = 0;
        let isConnectedToKeyAttribute = false;
        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            const edgeType = edge.type;
            
            if (nodeType === this.ENTITY_TYPE && edgeType === this.WEIGHTED_EDGE_TYPE) {
                isConnectedToEntity += 1;
                isConnectedToWeightedEdge += 1;
            } else if (nodeType === this.WEAK_ENTITY_TYPE && edgeType === this.WEIGHTED_EDGE_TYPE) {
                isConnectedToWeakEntity += 1;
                isConnectedToWeightedEdge += 1;
            }
            if (nodeType === this.KEY_ATTRIBUTE_TYPE) {
                isConnectedToKeyAttribute = true;
            }
            if (edgeType === this.WEIGHTED_EDGE_TYPE && (this.attributeTypes.includes(nodeType) && nodeType !== this.KEY_ATTRIBUTE_TYPE)) {
                return this.createMarker(MarkerKind.ERROR, 'Dependencia en existencia no puede estar conectada a atributos mediante aristas ponderadas', existenceDependenceRelationNode.id, 'ERR: existenceDependence-attributes-weightedEdge');
            }

        }

        if ((isConnectedToEntity != 1 || isConnectedToWeakEntity != 1) && isConnectedToWeightedEdge != 2) {
            return this.createMarker(MarkerKind.ERROR, 'Dependencia en existencia tiene que estar conectada a una entidad y a una entidad debil mediante aristas ponderadas.', existenceDependenceRelationNode.id, 'ERR: entitites-weighted-edge');
        }

        if (isConnectedToKeyAttribute) {
            return this.createMarker(MarkerKind.ERROR, 'Dependencia en existencia no puede estar conectada a un atributo con clave primaria.', existenceDependenceRelationNode.id, 'ERR: existenceDependence-keyAttribute');
        }

        return undefined;

    }

    /* Identifying dependence relation rules:
     * Identifying dependence relation not connected to anything.
     * Identifying dependence relation must be connected to one entity and one weak entity with weighted edges.
     * Identifying dependence relation must be connected to a key attribute with a transition.
     * Identifying dependence relation can't be connected to attributes with weighted edges.
     */
    protected validateIdentifyingDependenceRelation(identifyingDependenceRelationNode: GNode): Marker | undefined {
        const neighbors = this.getConnectedNeighbors(identifyingDependenceRelationNode);

        if (neighbors.length === 0) {
            return this.createMarker(MarkerKind.ERROR, 'Dependencia en identificacion aislada', identifyingDependenceRelationNode.id, 'ERR: sin conectar al modelo');
        }

        let isConnectedToWeightedEdge = 0;
        let isConnectedToEntity = 0;
        let isConnectedToWeakEntity = 0;
        let isConnectedToKeyAttribute = 0;
        for (const { otherNode, edge } of neighbors) {
            const nodeType = otherNode.type;
            const edgeType = edge.type;
            
            if (nodeType === this.ENTITY_TYPE && edgeType === this.WEIGHTED_EDGE_TYPE) {
                isConnectedToEntity += 1;
                isConnectedToWeightedEdge += 1;
            } else if (nodeType === this.WEAK_ENTITY_TYPE && edgeType === this.WEIGHTED_EDGE_TYPE) {
                isConnectedToWeakEntity += 1;
                isConnectedToWeightedEdge += 1;
            }
            if (nodeType === this.KEY_ATTRIBUTE_TYPE && edgeType === this.DEFAULT_EDGE_TYPE) {
                isConnectedToKeyAttribute += 1;
            }
            if (edgeType === this.WEIGHTED_EDGE_TYPE && this.attributeTypes.includes(nodeType)) {
                return this.createMarker(MarkerKind.ERROR, 'Dependencia en identificacion no puede estar conectada a atributos mediante aristas ponderadas', identifyingDependenceRelationNode.id, 'ERR: identifyingDependence-attributes-weightedEdge');
            }

        }

        if ((isConnectedToEntity != 1 || isConnectedToWeakEntity != 1) && isConnectedToWeightedEdge != 2) {
            return this.createMarker(MarkerKind.ERROR, 'Dependencia en identificacion tiene que estar conectada a una entidad y a una entidad debil mediante aristas ponderadas.', identifyingDependenceRelationNode.id, 'ERR: entitites-weighted-edge');
        }

        if (isConnectedToKeyAttribute != 1) {
            return this.createMarker(MarkerKind.ERROR, 'Dependencia en identificacion tiene que estar conectada a un atributo con clave primaria.', identifyingDependenceRelationNode.id, 'ERR: identifyingDependence-keyAttribute');
        }

        return undefined;

    }


}