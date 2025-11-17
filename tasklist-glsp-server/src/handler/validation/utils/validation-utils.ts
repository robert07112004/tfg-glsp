import { GEdge, GNode, Marker } from "@eclipse-glsp/server";
import { TaskListModelIndex } from "../../../model/tasklist-model-index";

export function getConnectedNeighbors(node: GNode, index: TaskListModelIndex): { otherNode: GNode, edge: GEdge }[] {
    const connectedEdges = [
        ...index.getIncomingEdges(node),
        ...index.getOutgoingEdges(node)
    ];
    const neighbors: { otherNode: GNode, edge: GEdge }[] = [];
    for (const edge of connectedEdges) {
        const otherNodeId = (edge.sourceId === node.id) ? edge.targetId : edge.sourceId;
        const otherNode = index.get(otherNodeId);
        if (otherNode && otherNode instanceof GNode) {
            neighbors.push({ otherNode, edge });
        }
    }
    return neighbors;
}

export function createMarker(kind: string, description: string, elementId: string, label: string): Marker {
    return { kind, description, elementId, label };
}
