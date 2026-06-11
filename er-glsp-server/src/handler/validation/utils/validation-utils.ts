import { Marker } from "@eclipse-glsp/server";

export function createMarker(kind: string, description: string, elementId: string, label: string): Marker {
    return { kind, description, elementId, label };
}

export function hasDefaultName(cleanedName: string, prefix: string): boolean {
    const nameWithoutType = cleanedName.split(':')[0];
    return new RegExp(`^${prefix}\\d+$`).test(nameWithoutType);
}
