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
            }
            /*else if (this.attributeTypes[0] === element.type) {
                const attributeMarker = this.validateAttribute(element);
                if (attributeMarker) {
                    markers.push(attributeMarker);
                }
            }*/
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

    /*protected validateAttribute(attributeNode: GNode): Marker | undefined {
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

        let isConnectedToAttribute = false;
        let isNotConnectedToEntity = false;
        for (const edge of connectedEdges) {
            const otherNodeId = (edge.sourceId === attributeNode.id) ? edge.targetId : edge.sourceId;
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

    }*/

    /*protected getOtherNode(currentNode: GNode, edge: GEdge): GNode | undefined {
        const otherNodeId = (edge.sourceId === currentNode.id) ? edge.targetId : edge.sourceId;
        const otherNode = this.index.get(otherNodeId);
        if (otherNode && otherNode instanceof GNode) {
            return otherNode;
        }
        return undefined;
    }*/
   
}