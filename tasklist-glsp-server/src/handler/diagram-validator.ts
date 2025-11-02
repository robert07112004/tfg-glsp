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
            } else if (this.relationTypes[0] === element.type) {
                const relationMarker = this.validateRelation(element);
                if (relationMarker) {
                    markers.push(relationMarker);
                }
            }
            // Validar Atributos
            /*else if (this.attributeTypes.includes(element.type)) {
                markers.push(...this.validateAttribute(element));
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
        for (const edge of connectedEdges) {
            const otherNodeId = (edge.sourceId === entityNode.id) ? edge.targetId : edge.sourceId;
            const otherNode = this.index.get(otherNodeId);
            if (otherNode && otherNode instanceof GNode) {
                if (this.relationTypes.includes(otherNode.type)) {
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
                kind: MarkerKind.ERROR,
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

    /* Relation rules:
     * Relation is not connected to anything.
     * Relation is connected to another relation.
     * Relation is not connected with weighted edges.
     * Relation is connected with key attribute.
     * Relation is connected with a weighted edge to a attribute.
     */
    protected validateRelation(relationNode: GNode): Marker | undefined {
        const connectedEdges = [
            ...this.index.getIncomingEdges(relationNode),
            ...this.index.getOutgoingEdges(relationNode)
        ];

        console.log("Numero de aristas: " + connectedEdges.length);
        for (const edge of connectedEdges) {
            console.log("Tipo de arista: " + edge.type);
        }

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
            console.log(otherNode.type);
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

        /*let entityConnectionCount = 0;
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
        }*/

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
                console.log(edge.type);
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

    /**
     * REGLA 3: Un Atributo (de cualquier tipo) debe estar conectado a UNA Entidad o Relación.
     */
    /*protected validateAttribute(attributeNode: GNode): Marker[] {
        const connectedEdges = this.index.getConnectedEdges(attributeNode);
        
        // Buscamos si tiene conexiones (asumimos que se conectan con 'edge:optional')
        const connections = connectedEdges.filter(
            e => e.type === 'edge:optional'
        ).length;

        if (connections === 0) {
            return [this.createMarker(
                attributeNode.id,
                'Error: Atributo aislado',
                'Este atributo no está conectado a ninguna entidad o relación.',
                MarkerKind.ERROR
            )];
        }
        
        if (connections > 1) {
             return [this.createMarker(
                attributeNode.id,
                'Error: Atributo ambiguo',
                'Este atributo está conectado a más de un elemento.',
                MarkerKind.WARNING // Puede ser un warning
            )];
        }

        return [];
    }*/

}