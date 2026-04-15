import {
    configureDefaultModelElements,
    configureModelElement,
    ConsoleLogger,
    ContainerConfiguration,
    DefaultTypes,
    DiamondNodeView,
    editLabelFeature,
    GEdge,
    GLabel,
    GLabelView,
    GNode,
    initializeDiagramContainer,
    LogLevel,
    PolylineEdgeView,
    RectangularNodeView,
    TYPES
} from '@eclipse-glsp/client';
import 'balloon-css/balloon.min.css';
import { Container, ContainerModule } from 'inversify';
import '../css/diagram.css';
import { AlternativeKeyAttributeView, AttributeView, ConstraintPortView, DerivedAttributeView, DisjointnessEdgeView, InclusionEdgeView, KeyAttributeView, MultiValuedAttributeView, OverlappingEdgeView, PartialExclusiveSpecializationView, PartialOverlappedSpecializationView, TotalExclusiveSpecializationView, TotalOverlappedSpecializationView, WeakEntityView, WeightedEdgeView } from './views';

const erDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn);

    const context = { bind, unbind, isBound, rebind };
    configureDefaultModelElements(context);

    // Nodes

    const nodeConfigs = [
        { type: DefaultTypes.NODE_RECTANGLE, view: RectangularNodeView },
        { type: 'node:weakEntity', view: WeakEntityView },
        { type: DefaultTypes.NODE_DIAMOND, view: DiamondNodeView },
        { type: 'node:existenceDependentRelation', view: DiamondNodeView },
        { type: 'node:identifyingDependentRelation', view: DiamondNodeView },
        { type: 'node:partialExclusiveSpecialization', view: PartialExclusiveSpecializationView },
        { type: 'node:totalExclusiveSpecialization', view: TotalExclusiveSpecializationView },
        { type: 'node:partialOverlappedSpecialization', view: PartialOverlappedSpecializationView },
        { type: 'node:totalOverlappedSpecialization', view: TotalOverlappedSpecializationView },
        { type: 'node:attribute', view: AttributeView },
        { type: 'node:multiValuedAttribute', view: MultiValuedAttributeView },
        { type: 'node:derivedAttribute', view: DerivedAttributeView },
        { type: 'node:keyAttribute', view: KeyAttributeView },
        { type: 'node:alternativeKeyAttribute', view: AlternativeKeyAttributeView }
    ];

    nodeConfigs.forEach(({ type, view }) => {
        configureModelElement(context, type, GNode, view, { enable: [editLabelFeature] });
    });

    // Edges

    const edgeConfigs = [
        { type: 'edge:weighted', view: WeightedEdgeView },
        { type: 'edge:optional', view: PolylineEdgeView },
        { type: 'edge:exclusion', view: PolylineEdgeView },
        { type: 'edge:inclusion', view: InclusionEdgeView },
        { type: 'edge:disjointness', view: DisjointnessEdgeView },
        { type: 'edge:overlap', view: OverlappingEdgeView }
    ];

    edgeConfigs.forEach(({ type, view }) => {
        configureModelElement(context, type, GEdge, view);
    });

    // Port
    configureModelElement(context, 'port:constraint', GNode, ConstraintPortView);

    // Editable labels

    ['label:weighted', DefaultTypes.LABEL].forEach(type => {
        configureModelElement(context, type, GLabel, GLabelView, { enable: [editLabelFeature] });
    });

    // Static labels

    ['label:cardinality', 'label:static'].forEach(type => {
        configureModelElement(context, type, GLabel, GLabelView);
    });

});

export function initializeErDiagramContainer(container: Container, ...containerConfiguration: ContainerConfiguration): Container {
    return initializeDiagramContainer(container, erDiagramModule, ...containerConfiguration);
}
