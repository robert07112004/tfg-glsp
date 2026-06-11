import {
    Args,
    CreateEdgeOperation,
    CreateNodeOperation,
    CreateOperationHandler,
    DefaultTypes,
    MaybePromise,
    OperationHandlerRegistry,
    PaletteItem,
    ToolPaletteItemProvider
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';

const ENTITY_TYPE_IDS = [DefaultTypes.NODE_RECTANGLE, 'node:weakEntity'];
const ATTRIBUTE_TYPE_IDS = [
    'node:attribute',
    'node:keyAttribute',
    'node:alternativeKeyAttribute',
    'node:multiValuedAttribute',
    'node:derivedAttribute'
];
const RELATION_TYPE_IDS = [
    DefaultTypes.NODE_DIAMOND,
    'node:existenceDependentRelation',
    'node:identifyingDependentRelation'
];
const HIERARCHY_TYPE_IDS = [
    'node:partialExclusiveSpecialization',
    'node:totalExclusiveSpecialization',
    'node:partialOverlappedSpecialization',
    'node:totalOverlappedSpecialization'
];

const ER_SORT_ORDER: Record<string, string> = {
    // Attributes
    'node:keyAttribute':                   '1',
    'node:alternativeKeyAttribute':        '2',
    'node:attribute':                      '3',
    'node:multiValuedAttribute':           '4',
    'node:derivedAttribute':               '5',
    // Relations
    [DefaultTypes.NODE_DIAMOND]:           '1',
    'node:existenceDependentRelation':     '2',
    'node:identifyingDependentRelation':   '3',
    // Hierarchy
    'node:totalExclusiveSpecialization':   '1',
    'node:totalOverlappedSpecialization':  '2',
    'node:partialExclusiveSpecialization': '3',
    'node:partialOverlappedSpecialization':'4',
    // Edges
    [DefaultTypes.EDGE]:                   '1',
    'edge:optional':                       '2',
    'weighted-edge':                       '3'
};

@injectable()
export class ErToolPaletteItemProvider extends ToolPaletteItemProvider {
    @inject(OperationHandlerRegistry) operationHandlerRegistry: OperationHandlerRegistry;

    private counter = 0;

    getItems(_args?: Args): MaybePromise<PaletteItem[]> {
        this.counter = 0;
        const all = this.operationHandlerRegistry.getAll().filter(CreateOperationHandler.is) as CreateOperationHandler[];
        const nodes = all.filter(h => h.operationType === CreateNodeOperation.KIND);
        const edges = all.filter(h => h.operationType === CreateEdgeOperation.KIND);

        return [
            this.group('entities-group', 'Entities', 'A', nodes, ENTITY_TYPE_IDS, 'er-entity'),
            this.group('attributes-group', 'Attributes', 'B', nodes, ATTRIBUTE_TYPE_IDS, 'er-attribute'),
            this.group('relations-group', 'Relations', 'C', nodes, RELATION_TYPE_IDS, 'er-relation'),
            this.group('hierarchy-group', 'Hierarchy', 'D', nodes, HIERARCHY_TYPE_IDS, 'er-hierarchy'),
            this.group('edges-group', 'Edges', 'E', edges, [], 'er-edge')
        ];
    }

    private group(id: string, label: string, sortString: string, handlers: CreateOperationHandler[], typeIds: string[], icon: string): PaletteItem {
        const filtered = typeIds.length > 0
            ? handlers.filter(h => h.elementTypeIds.some(t => typeIds.includes(t)))
            : handlers;
        const children = filtered.map(h => this.toItem(h)).sort((a, b) => a.sortString.localeCompare(b.sortString));
        return { id, label, actions: [], children, icon, sortString };
    }

    private toItem(handler: CreateOperationHandler): PaletteItem {
        const action = handler.getTriggerActions()[0];
        const typeId = handler.elementTypeIds[0];
        const sortString = ER_SORT_ORDER[typeId] ?? handler.label.charAt(0);
        return {
            id: `palette-item-${this.counter++}`,
            label: handler.label,
            actions: [action],
            sortString
        };
    }
}
