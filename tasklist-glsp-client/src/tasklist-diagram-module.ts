/********************************************************************************
 * Copyright (c) 2022-2023 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied:
 * -- GNU General Public License, version 2 with the GNU Classpath Exception
 * which is available at https://www.gnu.org/software/classpath/license.html
 * -- MIT License which is available at https://opensource.org/license/mit.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0 OR MIT
 ********************************************************************************/
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
import { AlternativeKeyAttributeView, AttributeView, DerivedAttributeView, ExclusivityEdgeView, ExclusivityPortView, InclusionEdgeView, KeyAttributeView, MultiValuedAttributeView, PartialExclusiveSpecializationView, PartialOverlappedSpecializationView, TotalExclusiveSpecializationView, TotalOverlappedSpecializationView, WeakEntityView, WeightedEdgeView } from './views';

const taskListDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn);
    const context = { bind, unbind, isBound, rebind };
    configureDefaultModelElements(context);

    // Nodes
    configureModelElement(context, DefaultTypes.NODE_RECTANGLE, GNode, RectangularNodeView, { enable: [editLabelFeature] });
    configureModelElement(context, 'node:weakEntity', GNode, WeakEntityView, { enable: [editLabelFeature] });
    configureModelElement(context, DefaultTypes.NODE_DIAMOND, GNode, DiamondNodeView, { enable: [editLabelFeature] });
    configureModelElement(context, 'node:existenceDependentRelation', GNode, DiamondNodeView, { enable: [editLabelFeature] });
    configureModelElement(context, 'node:identifyingDependentRelation', GNode, DiamondNodeView, { enable: [editLabelFeature] });
    configureModelElement(context, 'node:partialExclusiveSpecialization', GNode, PartialExclusiveSpecializationView, { enable: [editLabelFeature] });
    configureModelElement(context, 'node:totalExclusiveSpecialization', GNode, TotalExclusiveSpecializationView, { enable: [editLabelFeature] });
    configureModelElement(context, 'node:partialOverlappedSpecialization', GNode, PartialOverlappedSpecializationView, { enable: [editLabelFeature] });
    configureModelElement(context, 'node:totalOverlappedSpecialization', GNode, TotalOverlappedSpecializationView, { enable: [editLabelFeature] });
    configureModelElement(context, 'node:attribute', GNode, AttributeView, { enable: [editLabelFeature] });
    configureModelElement(context, 'node:multiValuedAttribute', GNode, MultiValuedAttributeView, { enable: [editLabelFeature] });
    configureModelElement(context, 'node:derivedAttribute', GNode, DerivedAttributeView, { enable: [editLabelFeature] });
    configureModelElement(context, 'node:keyAttribute', GNode, KeyAttributeView, { enable: [editLabelFeature] });
    configureModelElement(context, 'node:alternativeKeyAttribute', GNode, AlternativeKeyAttributeView, { enable: [editLabelFeature] });

    // Edges
    configureModelElement(context, 'edge:weighted', GEdge, WeightedEdgeView);
    configureModelElement(context, 'edge:optional', GEdge, PolylineEdgeView);
    configureModelElement(context, 'edge:exclusion', GEdge, PolylineEdgeView);
    configureModelElement(context, 'edge:inclusion', GEdge, InclusionEdgeView);

    configureModelElement(context, 'edge:exclusivity', GEdge, ExclusivityEdgeView);
    configureModelElement(context, 'port:exclusivity', GNode, ExclusivityPortView);

    // Labels
    configureModelElement(context, DefaultTypes.LABEL, GLabel, GLabelView, { enable: [editLabelFeature] });
    configureModelElement(context, 'label:weighted', GLabel, GLabelView, { enable: [editLabelFeature] });
    configureModelElement(context, 'label:cardinality', GLabel, GLabelView);
    configureModelElement(context, 'label:static', GLabel, GLabelView);
});

export function initializeTasklistDiagramContainer(container: Container, ...containerConfiguration: ContainerConfiguration): Container {
    return initializeDiagramContainer(container, taskListDiagramModule, ...containerConfiguration);
}
