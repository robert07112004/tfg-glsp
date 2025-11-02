/** @jsx svg */
import {
    angleOfPoint,
    GEdge,
    GNode,
    IView,
    Point,
    PolylineEdgeViewWithGapsOnIntersections,
    RenderingContext,
    svg,
    toDegrees
} from '@eclipse-glsp/client';
import { injectable } from 'inversify';
import { VNode } from 'snabbdom';

@injectable()
export class WeightedEdgeView extends PolylineEdgeViewWithGapsOnIntersections {
    protected override renderAdditionals(edge: GEdge, segments: Point[], context: RenderingContext): VNode[] {
        const additionals = super.renderAdditionals(edge, segments, context);

        const p1 = segments[segments.length - 2];
        const p2 = segments[segments.length - 1];

        const arrow = (
            <path
                class-sprotty-edge={true}
                class-arrow={true}
                d="M 1,0 L 10,-4 L 10,4 Z"
                transform={`rotate(${toDegrees(angleOfPoint(Point.subtract(p1, p2)))} ${p2.x} ${p2.y}) translate(${p2.x} ${p2.y})`}
            />
        );
        additionals.push(arrow);

        /*const label = edge.children.find(c => c.type === 'label:weighted') as GLabel | undefined;
            if (label) {
                const midPoint: Point = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
                additionals.push(
                    <text
                        x={midPoint.x}
                        y={midPoint.y - 5}
                        text-anchor="middle"
                        class={{ 'weighted-edge-label': true }}
                    >
                        {label.text}
                    </text>
                );
            }*/

        return additionals;
    }
}


@injectable()
export class AttributeView implements IView {
    render(node: GNode, context: RenderingContext): VNode {
        return <g>
            <ellipse
                class-sprotty-node={true}
                class-selected={node.selected}
                class-attribute-node={true} 
                cx={node.size.width / 2}
                cy={node.size.height / 2}
                rx={node.size.width / 2}
                ry={node.size.height / 2}
            />
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class MultiValuedAttributeView implements IView {
    render(node: GNode, context: RenderingContext): VNode {
        const padding = 3; 

        const innerRx = Math.max(0, (node.size.width / 2) - padding);
        const innerRy = Math.max(0, (node.size.height / 2) - padding);

        return <g>
            <ellipse
                class-sprotty-node={true} 
                class-selected={node.selected}
                class-multi-valued-attribute-node={true}
                cx={node.size.width / 2}
                cy={node.size.height / 2}
                rx={node.size.width / 2}
                ry={node.size.height / 2}
            />
            <ellipse
                class-multi-valued-attribute-node-inner={true}
                cx={node.size.width / 2}
                cy={node.size.height / 2}
                rx={innerRx}
                ry={innerRy} 
            />
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class DerivedAttributeView implements IView {
    render(node: GNode, context: RenderingContext): VNode {
        const padding = 0; 

        const innerRx = Math.max(0, (node.size.width / 2) - padding);
        const innerRy = Math.max(0, (node.size.height / 2) - padding);

        return <g>
            <ellipse
                class-sprotty-node={true} 
                class-selected={node.selected}
                class-derived-attribute-node={true}
                cx={node.size.width / 2}
                cy={node.size.height / 2}
                rx={node.size.width / 2}
                ry={node.size.height / 2}
            />
            <ellipse
                class-derived-attribute-node-inner={true}
                cx={node.size.width / 2}
                cy={node.size.height / 2}
                rx={innerRx}
                ry={innerRy} 
            />
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class KeyAttributeView implements IView {
    render(node: GNode, context: RenderingContext): VNode {
        return <g>
            <ellipse
                class-sprotty-node={true}
                class-selected={node.selected}
                class-key-attribute-node={true} 
                cx={node.size.width / 2}
                cy={node.size.height / 2}
                rx={node.size.width / 2}
                ry={node.size.height / 2}
            />
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class WeakEntityView implements IView {
    render(node: GNode, context: RenderingContext): VNode {
        const padding = 3;

        const innerWidth = Math.max(0, node.size.width - padding * 2);
        const innerHeight = Math.max(0, node.size.height - padding * 2);

        return <g>
            <rect
                class-sprotty-node={true}
                class-selected={node.selected}
                class-weak-entity-node={true}
                width={node.size.width}
                height={node.size.height}
            />
            <rect 
                class-weak-entity-node-inner={true}
                x={padding}
                y={padding}
                width={innerWidth}
                height={innerHeight}
            />
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class PartialExclusiveSpecializationView implements IView {
    render(node: GNode, context: RenderingContext): VNode {
        const w = node.size.width;
        const h = node.size.height;
        const w2 = w / 2;

        const trianglePath = `M ${w2},${h} L 0,0 L ${w},0 Z`;
        const arcPath = `M ${w2 - 25},${h + 2} Q ${w2},${h + 12} ${w2 + 25},${h + 2}`;
        
        return <g>
            <path
                class-sprotty-node={true}
                class-selected={node.selected}
                class-specialization-triangle-node={true}
                d={trianglePath}
            />
            <path
                class-exclusive-arc={true}
                d={arcPath}
                fill="none"
                stroke="var(--sprotty-edge-stroke, #222)"
                stroke-width="var(--sprotty-edge-stroke-width, 2px)"
            />
            {context.renderChildren(node)} 
        </g>;
    }
}

@injectable()
export class TotalExclusiveSpecializationView implements IView {
    render(node: GNode, context: RenderingContext): VNode {
        const w = node.size.width;
        const h = node.size.height;
        const w2 = w / 2;
        
        const circleRadius = 8;
        const lineLength = 15;
        const circleCenterY = -lineLength - circleRadius; 
        const lineEndY = -lineLength; 

        const trianglePath = `M ${w2},${h} L 0,0 L ${w},0 Z`;
        const arcPath = `M ${w2 - 25},${h + 2} Q ${w2},${h + 12} ${w2 + 25},${h + 2}`;
        const linePath = `M ${w2},0 L ${w2},${lineEndY}`;

        return <g>
            <path
                class-sprotty-node={true}
                class-selected={node.selected}
                class-specialization-triangle-node={true}
                d={trianglePath}
            />
            <path
                class-exclusive-arc={true}
                d={arcPath}
                fill="none"
                stroke="var(--sprotty-edge-stroke, #222)"
                stroke-width="var(--sprotty-edge-stroke-width, 2px)"
            />
            <path
                class-total-line={true}
                d={linePath}
                fill="none"
                stroke="var(--sprotty-edge-stroke, #222)"
                stroke-width="var(--sprotty-edge-stroke-width, 2px)"
            />
            <ellipse
                class-total-circle={true}
                cx={w2}
                cy={circleCenterY}
                rx={circleRadius}
                ry={circleRadius}
            />
            {context.renderChildren(node)} 
        </g>;
    }
}

@injectable()
export class PartialOverlappedSpecializationView implements IView {
    render(node: GNode, context: RenderingContext): VNode {
        const w = node.size.width;
        const h = node.size.height;
        const w2 = w / 2;

        const trianglePath = `M ${w2},${h} L 0,0 L ${w},0 Z`;
        
        return <g>
            <path
                class-sprotty-node={true}
                class-selected={node.selected}
                class-specialization-triangle-node={true}
                d={trianglePath}
            />
            {context.renderChildren(node)} 
        </g>;
    }
}

@injectable()
export class TotalOverlappedSpecializationView implements IView {
    render(node: GNode, context: RenderingContext): VNode {
        const w = node.size.width;
        const h = node.size.height;
        const w2 = w / 2;
        
        const circleRadius = 8;
        const lineLength = 15;
        const circleCenterY = -lineLength - circleRadius; 
        const lineEndY = -lineLength; 

        const trianglePath = `M ${w2},${h} L 0,0 L ${w},0 Z`;
        const linePath = `M ${w2},0 L ${w2},${lineEndY}`;

        return <g>
            <path
                class-sprotty-node={true}
                class-selected={node.selected}
                class-specialization-triangle-node={true}
                d={trianglePath}
            />
            <path
                class-total-line={true}
                d={linePath}
                fill="none"
                stroke="var(--sprotty-edge-stroke, #222)"
                stroke-width="var(--sprotty-edge-stroke-width, 2px)"
            />
            <ellipse
                class-total-circle={true}
                cx={w2}
                cy={circleCenterY}
                rx={circleRadius}
                ry={circleRadius}
            />
            {context.renderChildren(node)} 
        </g>;
    }
}