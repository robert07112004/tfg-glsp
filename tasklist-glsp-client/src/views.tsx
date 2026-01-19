/** @jsx svg */
import {
    angleOfPoint,
    GEdge,
    GNode,
    IView,
    Point,
    PolylineEdgeView,
    PolylineEdgeViewWithGapsOnIntersections,
    RenderingContext,
    svg,
    toDegrees
} from '@eclipse-glsp/client';
import { injectable } from 'inversify';
import { VNode } from 'snabbdom';

@injectable()
export class ExclusivityPortView implements IView {
    render(port: GNode, context: RenderingContext): VNode {
        return <g>
            <circle
                class-exclusivity-port={true}
                class-sprotty-node={true}
                r={4}
                cx={0}
                cy={0}
            />
        </g>;
    }
}

@injectable()
export class WeightedEdgeView extends PolylineEdgeViewWithGapsOnIntersections {
    protected override renderAdditionals(edge: GEdge, segments: Point[], context: RenderingContext): VNode[] {
        const additionals = super.renderAdditionals(edge, segments, context);
        const p1 = segments[segments.length - 2];
        const p2 = segments[segments.length - 1];
        const arrow = (
            <path
                class-sprotty-edge={true}
                transform={`rotate(${toDegrees(angleOfPoint(Point.subtract(p1, p2)))} ${p2.x} ${p2.y}) translate(${p2.x} ${p2.y})`}
            />
        );
        additionals.push(arrow);
        return additionals;
    }
}

@injectable()
export class ExclusivityEdgeView extends PolylineEdgeView {
    protected override renderLine(edge: GEdge, segments: Point[], context: RenderingContext): VNode {
        if (segments.length < 2) {
            return <g/>;
        }
        if (segments.length === 2) {
            const p1 = segments[0];
            const p2 = segments[1];
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            const offset = 20; 
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const nx = -(dy / length) * offset;
            const ny = (dx / length) * offset;
            const controlPoint = {
                x: midX + nx,
                y: midY + ny
            };
            const pathData = `M ${p1.x},${p1.y} Q ${controlPoint.x},${controlPoint.y} ${p2.x},${p2.y}`;
            return <path
                class-sprotty-edge={true}
                class-exclusivity-edge={true}
                d={pathData}
                fill="none"
            />;
        }
        return super.renderLine(edge, segments, context);
    }
    /*
    protected override renderAdditionals(edge: GEdge, segments: Point[], context: RenderingContext): VNode[] {
        const additionals = super.renderAdditionals(edge, segments, context);
        // Aquí puedes añadir flechas o símbolos adicionales al final de la curva si lo necesitas
        return additionals;
    }
    */
}

@injectable()
export class InclusionEdgeView extends PolylineEdgeView {
    protected override renderAdditionals(edge: GEdge, segments: Point[], context: RenderingContext): VNode[] {
        const additionals = super.renderAdditionals(edge, segments, context);
        const p1 = segments[segments.length - 2];
        const p2 = segments[segments.length - 1];
        if (p1 && p2) {
            const angle = toDegrees(angleOfPoint(Point.subtract(p1, p2)));
            const arrow = (
                <path
                    class-sprotty-edge={true}
                    class-inclusion-arrow={true}
                    d="M 0,0 L 10,-4 L 10,4 Z"
                    transform={`rotate(${angle} ${p2.x} ${p2.y}) translate(${p2.x} ${p2.y})`}
                />
            );
            additionals.push(arrow);
        }
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
export class AlternativeKeyAttributeView implements IView {
    render(node: GNode, context: RenderingContext): VNode {
        const cx = node.size.width / 2;
        const cy = node.size.height / 2;
        const linePadding = 15; 
        const lineOffsetY = 5; 

        return <g>
            <ellipse
                class-sprotty-node={true}
                class-selected={node.selected}
                class-alternative-key-attribute-node={true}
                cx={cx}
                cy={cy}
                rx={cx}
                ry={cy}
            />
            {context.renderChildren(node)}
            <line
                x1={linePadding}
                y1={cy + lineOffsetY}
                x2={node.size.width - linePadding}
                y2={cy + lineOffsetY}
                
                stroke="black"            
                stroke-width="1"          
                stroke-dasharray="5, 3"   
                class-alternative-key-line={true} 
            />
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