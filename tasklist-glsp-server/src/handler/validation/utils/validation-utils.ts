import { Marker } from "@eclipse-glsp/server";

export function createMarker(kind: string, description: string, elementId: string, label: string): Marker {
    return { kind, description, elementId, label };
}
