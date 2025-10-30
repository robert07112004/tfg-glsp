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

    override doBatchValidation(element: GModelElement): Marker[] {
        const markers: Marker[] = [];
        
        if (element instanceof GNode) {
            if (this.entityTypes[0] === element.type) {
                const entityMarker = this.validateEntity(element);
                if (entityMarker) {
                    markers.push(entityMarker);
                }
            }
            // Validar Relaciones
            /*else if (this.relationTypes.includes(element.type)) {
                markers.push(...this.validateRelation(element));
            }
            // Validar Atributos
            else if (this.attributeTypes.includes(element.type)) {
                markers.push(...this.validateAttribute(element));
            }*/
        }
        
        // También podríamos validar aristas (GEdge) si quisiéramos
        // if (GEdge.is(element)) { ... }
        
        return markers;
    }

    /* Entity rules:
     * Entity is not connected to anything.
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
                label: 'Esta entidad no está conectada a ninguna relación o atributo.'
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
                label: 'Esta entidad no participa en ninguna relación. (Solo está conectada a atributos).'
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
                label: 'Esta entidad no está conectada a ningún atributo. (Solo está conectada a una relación).'
            };
        }
        if (!isConnectedToKeyAttribute) {
            return {
                kind: MarkerKind.ERROR,
                description: 'Entidad no conectada a ningún atributo que sea una clave primaria',
                elementId: entityNode.id,
                label: 'No está conectada a ninguna clave primaria'
            };
        }

        return undefined;
    }

    /*protected validateRelation(relationNode: GNode): Marker[] {
        const connectedEdges = this.index.getConnectedEdges(relationNode);
        
        // Contamos cuántas conexiones de tipo 'weighted-edge' (las que van a entidades) tiene
        const entityConnections = connectedEdges.filter(
            e => e.type === 'weighted-edge'
        ).length;

        if (entityConnections < 2) {
            return [this.createMarker(
                relationNode.id,
                'Error: Relación incompleta',
                'Una relación debe estar conectada al menos a dos entidades.',
                MarkerKind.ERROR
            )];
        }
        return [];
    }*/

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