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
import { WeightedEdge } from './model';
import { AttributeView, DerivedAttributeView, KeyAttributeView, MultiValuedAttributeView, SpecializationTriangleView, TotalExclusiveSpecializationView, WeakEntityView, WeightedEdgeView } from './views';

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
    configureModelElement(context, 'node:exclusiveSpecialization', GNode, SpecializationTriangleView, { enable: [editLabelFeature] });
    configureModelElement(context, 'node:totalExclusiveSpecialization', GNode, TotalExclusiveSpecializationView, { enable: [editLabelFeature] });
    configureModelElement(context, 'node:attribute', GNode, AttributeView, { enable: [editLabelFeature] });
    configureModelElement(context, 'node:multiValuedAttribute', GNode, MultiValuedAttributeView, { enable: [editLabelFeature] });
    configureModelElement(context, 'node:derivedAttribute', GNode, DerivedAttributeView, { enable: [editLabelFeature] });
    configureModelElement(context, 'node:keyAttribute', GNode, KeyAttributeView, { enable: [editLabelFeature] });
    configureModelElement(context, 'weighted-edge', WeightedEdge, WeightedEdgeView, { enable: [editLabelFeature]});
    
    // Edges
    configureModelElement(context, 'edge:optional', GEdge, PolylineEdgeView);

    // Labels
    configureModelElement(context, DefaultTypes.LABEL, GLabel, GLabelView, { enable: [editLabelFeature] });
    configureModelElement(context, 'label:weighted', GLabel, GLabelView, { enable: [editLabelFeature] });
    configureModelElement(context, 'label:cardinality', GLabel, GLabelView);
    configureModelElement(context, 'label:static', GLabel, GLabelView);
});

export function initializeTasklistDiagramContainer(container: Container, ...containerConfiguration: ContainerConfiguration): Container {
    return initializeDiagramContainer(container, taskListDiagramModule, ...containerConfiguration);
}
