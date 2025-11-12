import {
    AbstractModelValidator,
    DefaultTypes,
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

    protected entityTypes = [
        DefaultTypes.NODE_RECTANGLE,
        'node:weakEntity'
    ];

    protected relationTypes = [
        DefaultTypes.NODE_DIAMOND,
        'node:existenceDependentRelation',
        'node:identifyingDependentRelation',
        'node:partialExclusiveSpecialization',
        'node:totalExclusiveSpecialization',
        'node:partialOverlappedSpecialization',
        'node:totalOverlappedSpecialization'
    ];

    protected attributeTypes = [
        'node:attribute',
        'node:keyAttribute',
        'node:multiValuedAttribute',
        'node:derivedAttribute'
    ];

    protected edgeTypes = [
        DefaultTypes.EDGE,
        'edge:weighted',
        'edge:optional'
    ];

    override doBatchValidation(element: GModelElement): Marker[] {
        const markers: Marker[] = [];
        
        if (element instanceof GNode) {
            if (this.entityTypes[0] === element.type) {
                const entityMarker = this.validateEntity(element);
                if (entityMarker) {
                    markers.push(entityMarker);
                }
            } else if (this.entityTypes[1] === element.type) {
                const weakEntityMarker = this.validateWeakEntity(element);
                if (weakEntityMarker) {
                    markers.push(weakEntityMarker);
                }
            } else if (this.relationTypes[0] === element.type) {
                const relationMarker = this.validateRelation(element);
                if (relationMarker) {
                    markers.push(relationMarker);
                }
            } else if (this.attributeTypes[0] === element.type) {
                const attributeMarker = this.validateAttribute(element);
                if (attributeMarker) {
                    markers.push(attributeMarker);
                }
            } else if (this.attributeTypes[1] === element.type) {
                const keyAttributeMarker = this.validateKeyAttribute(element);
                if (keyAttributeMarker) {
                    markers.push(keyAttributeMarker);
                }
            }
        }
        
        // También podríamos validar aristas (GEdge) si quisiéramos
        // if (GEdge.is(element)) { ... }
        
        return markers;
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
        const connectedEdges = [
            ...this.index.getIncomingEdges(entityNode),
            ...this.index.getOutgoingEdges(entityNode)
        ];

        if (connectedEdges.length === 0) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Entidad aislada',
                elementId: entityNode.id,
                label: 'ERR: sin conectar al modelo'
            };
        }

        let isNotConnectedToEntity = true;
        for (const edge of connectedEdges) {
            const otherNodeId = (edge.sourceId === entityNode.id) ? edge.targetId : edge.sourceId;
            const otherNode = this.index.get(otherNodeId);
            if (otherNode && otherNode instanceof GNode) {
                if (this.entityTypes.includes(otherNode.type)) {
                    isNotConnectedToEntity = false;
                    break;
                }
            }
        }
        if (!isNotConnectedToEntity) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Entidad conectada con otra entidad',
                elementId: entityNode.id,
                label: 'ERR: entidad-entidad'
            };
        }

        let isConnectedToRelation = false;
        let isConnectedWithWeightedEdge = false;
        for (const edge of connectedEdges) {
            const otherNodeId = (edge.sourceId === entityNode.id) ? edge.targetId : edge.sourceId;
            const otherNode = this.index.get(otherNodeId);
            if (otherNode && otherNode instanceof GNode) {
                if (this.relationTypes.includes(otherNode.type)) {
                    if (this.edgeTypes[1] === edge.type) {
                        isConnectedWithWeightedEdge = true;     
                    }
                    isConnectedToRelation = true;
                    break;
                }
            }
        }
        if (!isConnectedToRelation) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Entidad no conectada a ninguna relación',
                elementId: entityNode.id,
                label: 'ERR: entidad-sinRelación'
            };
        }
        if (!isConnectedWithWeightedEdge) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Entidad no conectada a ninguna relación con una arista ponderada',
                elementId: entityNode.id,
                label: 'ERR: entidad-sinRelación-aristaPonderada'
            };
        }

        let isConnectedToAttributes = false;
        let isConnectedToKeyAttribute = false;
        for (const edge of connectedEdges) {
            const otherNodeId = (edge.sourceId === entityNode.id) ? edge.targetId : edge.sourceId;
            const otherNode = this.index.get(otherNodeId);
            if (otherNode && otherNode instanceof GNode) {
                if (this.attributeTypes.includes(otherNode.type)) {
                    isConnectedToAttributes = true;
                    if (this.attributeTypes[1] === otherNode.type) {
                        isConnectedToKeyAttribute = true;
                        break;
                    }
                }
            }
        }
        if (!isConnectedToAttributes) {
            return {
                kind: MarkerKind.WARNING,
                description: 'Entidad no conectada a ningún atributo',
                elementId: entityNode.id,
                label: 'ERR: entidad-sinAtributo'
            };
        }
        if (!isConnectedToKeyAttribute) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Entidad no conectada a ningún atributo que sea una clave primaria',
                elementId: entityNode.id,
                label: 'ERR: entidad-sinClavePrimaria'
            };
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
        const connectedEdges = [
            ...this.index.getIncomingEdges(weakEntityNode),
            ...this.index.getOutgoingEdges(weakEntityNode)
        ];

        if (connectedEdges.length === 0) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Entidad débil aislada',
                elementId: weakEntityNode.id,
                label: 'ERR: weakEntity-isolated'
            };
        }

        let connectedToExistenceDep = false;
        let connectedToIdentifyingDep = false;
        let connectedToStrongEntity = false;
        let hasPrimaryKey = false;
        let hasAnyAttribute = false;

        for (const edge of connectedEdges) {
            const attrNodeId = (edge.sourceId === weakEntityNode.id) ? edge.targetId : edge.sourceId;
            const attrNode = this.index.get(attrNodeId);
            if (attrNode && attrNode instanceof GNode) {
                if (this.edgeTypes[0] === edge.type && this.attributeTypes.includes(attrNode.type)) {
                    if (this.attributeTypes[1] === attrNode.type) {
                        hasPrimaryKey = true;
                    } else {
                        hasAnyAttribute = true;
                    }
                }
            }
        }

        for (const edge of connectedEdges) {
            const otherNodeId = (edge.sourceId === weakEntityNode.id) ? edge.targetId : edge.sourceId;
            const otherNode = this.index.get(otherNodeId);
            if (!otherNode || !(otherNode instanceof GNode)) continue;
            if (edge.type !== this.edgeTypes[0]  && this.attributeTypes.includes(otherNode.type)) {
                return {
                    kind: MarkerKind.ERROR,
                    description: 'Entidad débil no puede estar conectada a atributos mediante otro tipo de aristas que no sean transiciones.',
                    elementId: weakEntityNode.id,
                    label: 'ERR: weakEntity-noDependence-weightedEdge'
                };
            }

            if (this.relationTypes[1] === otherNode.type) {
                if (this.edgeTypes[1] !== edge.type) {
                    return {
                        kind: MarkerKind.ERROR,
                        description: 'Entidad débil no está conectada a ninguna dependencia en existencia mediante aristas ponderadas.',
                        elementId: weakEntityNode.id,
                        label: 'ERR: weakEntity-noDependence'
                    };
                } else {
                    connectedToExistenceDep = true;
                    connectedToStrongEntity ||= this.isConnectedToStrongEntity(otherNode);
                    if (!connectedToStrongEntity) {
                        return {
                            kind: MarkerKind.ERROR,
                            description: 'Entidad débil no está conectada a ninguna entidad fuerte con aristas ponderadas mediante una dependencia en existencia.',
                            elementId: weakEntityNode.id,
                            label: 'ERR: weakEntity-noStrongEntity'
                        };
                    }
                }
            }

            if (this.relationTypes[2] === otherNode.type) {
                if (this.edgeTypes[1] !== edge.type) {
                    return {
                        kind: MarkerKind.ERROR,
                        description: 'Entidad débil no está conectada a ninguna dependencia en identificacion mediante aristas ponderadas.',
                        elementId: weakEntityNode.id,
                        label: 'ERR: weakEntity-noDependence'
                    };
                } else {
                    connectedToIdentifyingDep = true;
                    connectedToStrongEntity ||= this.isConnectedToStrongEntity(otherNode);
                    if (!connectedToStrongEntity) {
                        return {
                            kind: MarkerKind.ERROR,
                            description: 'Entidad débil no está conectada a ninguna entidad fuerte con aristas ponderadas mediante una dependencia en identificacion.',
                            elementId: weakEntityNode.id,
                            label: 'ERR: weakEntity-noStrongEntity'
                        };
                    }
                }
            }
        }

        if (!connectedToExistenceDep && !connectedToIdentifyingDep) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Entidad débil no está conectada a ninguna dependencia en existencia o identificación.',
                elementId: weakEntityNode.id,
                label: 'ERR: weakEntity-noDependence'
            };
        }

        if (connectedToExistenceDep && !hasPrimaryKey) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Entidad débil conectada a una dependencia en existencia debe tener un atributo clave primaria.',
                elementId: weakEntityNode.id,
                label: 'ERR: weakEntity-existence-noPrimaryKey'
            };
        }

        if (connectedToIdentifyingDep && hasPrimaryKey) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Entidad débil conectada a una dependencia en identificación no puede tener clave primaria propia (solo clave parcial).',
                elementId: weakEntityNode.id,
                label: 'ERR: weakEntity-identifying-hasPrimaryKey'
            };
        }

        if (connectedToIdentifyingDep && !hasAnyAttribute) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Entidad débil con dependencia en identificación debe tener al menos un atributo (por ejemplo, clave parcial).',
                elementId: weakEntityNode.id,
                label: 'ERR: weakEntity-identifying-noAttributes'
            };
        }

        return undefined;
    }

    protected isConnectedToStrongEntity(dependenceNode: GNode): boolean {
        const connectedEdges = [
            ...this.index.getIncomingEdges(dependenceNode),
            ...this.index.getOutgoingEdges(dependenceNode)
        ];

        for (const edge of connectedEdges) {
            const nodeId = (edge.sourceId === dependenceNode.id) ? edge.targetId : edge.sourceId;
            const node = this.index.get(nodeId);
            if (node && node instanceof GNode) {
                if (this.edgeTypes[1] === edge.type && this.entityTypes[0] === node.type) {
                    return true;
                } else {

                }
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
        const connectedEdges = [
            ...this.index.getIncomingEdges(relationNode),
            ...this.index.getOutgoingEdges(relationNode)
        ];

        if (connectedEdges.length === 0) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Relación aislada',
                elementId: relationNode.id,
                label: 'ERR: sin conectar al modelo'
            };
        }

        let isConnectedToRelation = false;
        for (const edge of connectedEdges) {
            const otherNodeId = (edge.sourceId === relationNode.id) ? edge.targetId : edge.sourceId;
            const otherNode = this.index.get(otherNodeId);
            if (otherNode && otherNode instanceof GNode) {
                if (this.relationTypes.includes(otherNode.type)) {
                    isConnectedToRelation = true;
                    break;
                }
            }
        }
        if (isConnectedToRelation) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Relación está conectada a otra relación',
                elementId: relationNode.id,
                label: 'ERR: relación-relación'
            };
        }

        let entityConnectionCount = 0;
        let weightedEntityConnectionCount = 0;
        for (const edge of connectedEdges) {
            const otherNodeId = (edge.sourceId === relationNode.id) ? edge.targetId : edge.sourceId;
            const otherNode = this.index.get(otherNodeId);
            if (otherNode && otherNode instanceof GNode) {
                const isAttribute = this.attributeTypes.includes(otherNode.type);
                const isRelation = this.relationTypes.includes(otherNode.type);
                if (!isAttribute && !isRelation) {
                    entityConnectionCount++;
                    if (edge.type === this.edgeTypes[1]) { 
                        weightedEntityConnectionCount++;
                    }
                }
            }
        }

        if (weightedEntityConnectionCount != entityConnectionCount) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Relación debe estar conectada a entidades mediante aristas ponderadas',
                elementId: relationNode.id,
                label: 'ERR: cardinalidad'
            };
        }

        let isConnectedToKeyAttribute = false;
        for (const edge of connectedEdges) {
            const otherNodeId = (edge.sourceId === relationNode.id) ? edge.targetId : edge.sourceId;
            const otherNode = this.index.get(otherNodeId);
            if (otherNode && otherNode instanceof GNode) {
                if (this.attributeTypes[1] === otherNode.type) {
                    isConnectedToKeyAttribute = true;
                    break;
                }
            }
        }
        if (isConnectedToKeyAttribute) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Relación no puede estar conectada a un atributo con clave primaria',
                elementId: relationNode.id,
                label: 'ERR: relación-sinClavePrimaria'
            };
        }
        
        let isConnectedToAttributeWithWeightedEdge = false;
        for (const edge of connectedEdges) {
            const otherNodeId = (edge.sourceId === relationNode.id) ? edge.targetId : edge.sourceId;
            const otherNode = this.index.get(otherNodeId);
            if (otherNode && otherNode instanceof GNode) {
                if (this.attributeTypes[1] !== otherNode.type && edge.type === this.edgeTypes[1]) {
                    isConnectedToAttributeWithWeightedEdge = true;
                    break;
                }
            }
        }
        if (isConnectedToAttributeWithWeightedEdge) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Relación no puede estar conectada a un atributo mediante una arista ponderada',
                elementId: relationNode.id,
                label: 'ERR: relación-Atributo-aristaPonderada'
            };
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
        const connectedEdges = [
            ...this.index.getIncomingEdges(attributeNode),
            ...this.index.getOutgoingEdges(attributeNode)
        ];

        if (connectedEdges.length === 0) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Atributo aislado',
                elementId: attributeNode.id,
                label: 'ERR: sin conectar al modelo'
            };
        }

        let countAttributes = 0;
        let countRelations = 0;
        for (const edge of connectedEdges) {
            const otherNodeId = (edge.sourceId === attributeNode.id) ? edge.targetId : edge.sourceId;
            const otherNode = this.index.get(otherNodeId);
            if (otherNode && otherNode instanceof GNode) {
                if (this.attributeTypes.includes(otherNode.type)) {
                    countAttributes += 1;
                } else if (this.relationTypes.includes(otherNode.type)) {
                    countRelations += 1;
                }
            }
        }

        let countConnectedToAttribute = 0;
        let countConnectedToEntity = 0;
        let countConnectedToRelation = 0;
        let countConnectedToWeakEntity = 0;
        let countConnectedToKeyAttribute = 0;
        for (const edge of connectedEdges) {
            const otherNodeId = (edge.sourceId === attributeNode.id) ? edge.targetId : edge.sourceId;
            const otherNode = this.index.get(otherNodeId);
            if (edge.type === this.edgeTypes[1]) {
                return {
                    kind: MarkerKind.ERROR,
                    description: 'Atributo no puede estar conectado a nada mediante una arista ponderada.',
                    elementId: attributeNode.id,
                    label: 'ERR: Atributo-aristaPonderada'
                };
            }
            if (otherNode && otherNode instanceof GNode) {
                if (this.attributeTypes[0] === otherNode.type || this.edgeTypes[2] === edge.type) {
                    countConnectedToAttribute += 1;
                } else if (this.entityTypes[0] === otherNode.type) {
                    countConnectedToEntity += 1;
                } else if (this.relationTypes[0] === otherNode.type) {
                    countConnectedToRelation += 1;
                } else if (this.entityTypes[1] === otherNode.type) {
                    countConnectedToWeakEntity += 1;
                } else if (this.attributeTypes[1] === otherNode.type) {
                    countConnectedToKeyAttribute += 1;
                }
            }
        }

        if ((countConnectedToEntity != 0 || countConnectedToWeakEntity != 0) && countConnectedToKeyAttribute > 0) {
           return {
                kind: MarkerKind.ERROR,
                description: 'Atributo conectado a entidad normal o debil y a una clave primaria.',
                elementId: attributeNode.id,
                label: 'ERR: Atributo-entidad-entidadDebil-clavePrimaria'
            }; 
        }

        if (countAttributes !== countConnectedToAttribute) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Atributo normal solo puede conectarse a atributos normales u opcionales.',
                elementId: attributeNode.id,
                label: 'ERR: Atributo-atributoNormal-atributoOpcional'
            };
        }

        if (countRelations !== countConnectedToRelation) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Atributo normal solo puede conectarse a relaciones normales.',
                elementId: attributeNode.id,
                label: 'ERR: Atributo-relacion'
            };
        }

        if (countConnectedToAttribute > 1 && (countConnectedToEntity == 0 && countConnectedToWeakEntity == 0)) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Atributo conectado a otro atributo deberia estar conectado a una entidad o a una entidad debil.',
                elementId: attributeNode.id,
                label: 'ERR: Atributo-entidad-entidadDebil'
            };
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
        const connectedEdges = [
            ...this.index.getIncomingEdges(keyAttributeNode),
            ...this.index.getOutgoingEdges(keyAttributeNode)
        ];

        if (connectedEdges.length === 0) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Atributo aislado',
                elementId: keyAttributeNode.id,
                label: 'ERR: sin conectar al modelo'
            };
        }

        let countAttributes = 0;
        let countRelations = 0;
        for (const edge of connectedEdges) {
            const otherNodeId = (edge.sourceId === keyAttributeNode.id) ? edge.targetId : edge.sourceId;
            const otherNode = this.index.get(otherNodeId);
            if (otherNode && otherNode instanceof GNode) {
                if (this.attributeTypes.includes(otherNode.type)) {
                    countAttributes += 1;
                } else if (this.relationTypes.includes(otherNode.type)) {
                    countRelations += 1;
                }
            }
        }

        let countConnectedToEntity = 0;
        let countConnectedToAttribute = 0;
        let countConnectedToIdentifyingDep = 0;
        for (const edge of connectedEdges) {
            const otherNodeId = (edge.sourceId === keyAttributeNode.id) ? edge.targetId : edge.sourceId;
            const otherNode = this.index.get(otherNodeId);
            if (edge.type === this.edgeTypes[1]) {
                return {
                    kind: MarkerKind.ERROR,
                    description: 'Atributo no puede estar conectado a nada mediante una arista ponderada.',
                    elementId: keyAttributeNode.id,
                    label: 'ERR: Atributo-aristaPonderada'
                };
            } else if (otherNode && otherNode instanceof GNode && (this.entityTypes.includes(otherNode.type) || this.relationTypes[2] === otherNode.type) && edge.type === this.edgeTypes[2]) {
                return {
                    kind: MarkerKind.ERROR,
                    description: 'Atributo no puede estar conectado a una entidad mediante una arista utilizada en atributos opcionales.',
                    elementId: keyAttributeNode.id,
                    label: 'ERR: Atributo-aristaOpcional'
                };
            }
            if (otherNode && otherNode instanceof GNode) {
                if (this.entityTypes.includes(otherNode.type)) {
                    countConnectedToEntity += 1;
                } else if (this.attributeTypes[0] === otherNode.type) {
                    countConnectedToAttribute += 1;
                } else if (this.relationTypes[2] === otherNode.type) {
                    countConnectedToIdentifyingDep += 1;
                }
            }
        }

        if (countConnectedToEntity == 0) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Un atributo de clave primaria tiene que estar conectado a una entidad o a una entidad debil.',
                elementId: keyAttributeNode.id,
                label: 'ERR: atributoClavePrimaria-entidad-entidadDebil'
            };
        }

        if (countAttributes !== countConnectedToAttribute) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Atributo con clave primaria solo puede conectarse a atributos normales u opcionales para formar un atributo compuesto.',
                elementId: keyAttributeNode.id,
                label: 'ERR: atributoClavePrimaria-atributoNormal-atributoOpcional'
            };
        }

        if (countRelations !== countConnectedToIdentifyingDep) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Atributo con clave primaria solo puede conectarse a una dependencia de identificacion.',
                elementId: keyAttributeNode.id,
                label: 'ERR: atributoClavePrimaria-dependenciaEnIdentificacion'
            };
        }

        return undefined;
    }

}