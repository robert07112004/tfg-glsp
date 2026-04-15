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

// Port

@injectable()
export class ConstraintPortView implements IView {
    render(port: GNode, context: RenderingContext): VNode {
        return <g>
            <circle class-constraint-port={true} class-sprotty-node={true} r={4} cx={0} cy={0} />
        </g>;
    }
}

// Entities

@injectable()
export class WeakEntityView implements IView {
    render(node: GNode, context: RenderingContext): VNode {
        const p = 3;
        return <g>
            <rect class-sprotty-node={true} class-selected={node.selected} class-weak-entity-node={true} width={node.size.width} height={node.size.height} />
            <rect class-weak-entity-node-inner={true} x={p} y={p} width={Math.max(0, node.size.width - p*2)} height={Math.max(0, node.size.height - p*2)} />
            {context.renderChildren(node)}
        </g>;
    }
}

// Attributes

@injectable()
export class AttributeView implements IView {
    render(node: GNode, context: RenderingContext): VNode {
        const cx = node.size.width / 2;
        const cy = node.size.height / 2;
        return <g>
            <ellipse class-sprotty-node={true} class-selected={node.selected} class-attribute-node={true} cx={cx} cy={cy} rx={cx} ry={cy} />
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class KeyAttributeView implements IView {
    render(node: GNode, context: RenderingContext): VNode {
        const cx = node.size.width / 2;
        const cy = node.size.height / 2;
        return <g>
            <ellipse class-sprotty-node={true} class-selected={node.selected} class-key-attribute-node={true} cx={cx} cy={cy} rx={cx} ry={cy} />
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class AlternativeKeyAttributeView implements IView {
    render(node: GNode, context: RenderingContext): VNode {
        const cx = node.size.width / 2;
        const cy = node.size.height / 2;
        return <g>
            <ellipse class-sprotty-node={true} class-selected={node.selected} class-alternative-key-attribute-node={true} cx={cx} cy={cy} rx={cx} ry={cy} />
            {context.renderChildren(node)}
            <line x1={15} y1={cy + 5} x2={node.size.width - 15} y2={cy + 5} stroke="black" stroke-width="1" stroke-dasharray="5, 3" class-alternative-key-line={true} />
        </g>;
    }
}

@injectable()
export class MultiValuedAttributeView implements IView {
    render(node: GNode, context: RenderingContext): VNode {
        const cx = node.size.width / 2;
        const cy = node.size.height / 2;
        return <g>
            <ellipse class-sprotty-node={true} class-selected={node.selected} class-multi-valued-attribute-node={true} cx={cx} cy={cy} rx={cx} ry={cy} />
            <ellipse class-multi-valued-attribute-node-inner={true} cx={cx} cy={cy} rx={Math.max(0, cx - 3)} ry={Math.max(0, cy - 3)} />
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class DerivedAttributeView implements IView {
    render(node: GNode, context: RenderingContext): VNode {
        const cx = node.size.width / 2;
        const cy = node.size.height / 2;
        return <g>
            <ellipse class-sprotty-node={true} class-selected={node.selected} class-derived-attribute-node={true} cx={cx} cy={cy} rx={cx} ry={cy} />
            <ellipse class-derived-attribute-node-inner={true} cx={cx} cy={cy} rx={cx} ry={cy} />
            {context.renderChildren(node)}
        </g>;
    }
}

// Specializations

@injectable()
export class PartialExclusiveSpecializationView implements IView {
    render(node: GNode, context: RenderingContext): VNode {
        return <g>
            {renderSpecializationTriangle(node.size.width, node.size.height, node.selected)}
            {renderExclusiveArc(node.size.width / 2, node.size.height)}
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class TotalExclusiveSpecializationView implements IView {
    render(node: GNode, context: RenderingContext): VNode {
        return <g>
            {renderSpecializationTriangle(node.size.width, node.size.height, node.selected)}
            {renderExclusiveArc(node.size.width / 2, node.size.height)}
            {renderTotalIndicator(node.size.width / 2)}
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class PartialOverlappedSpecializationView implements IView {
    render(node: GNode, context: RenderingContext): VNode {
        return <g>
            {renderSpecializationTriangle(node.size.width, node.size.height, node.selected)}
            {context.renderChildren(node)}
        </g>;
    }
}

@injectable()
export class TotalOverlappedSpecializationView implements IView {
    render(node: GNode, context: RenderingContext): VNode {
        return <g>
            {renderSpecializationTriangle(node.size.width, node.size.height, node.selected)}
            {renderTotalIndicator(node.size.width / 2)}
            {context.renderChildren(node)}
        </g>;
    }
}

// Edges

@injectable()
export class WeightedEdgeView extends PolylineEdgeViewWithGapsOnIntersections {
    protected override renderAdditionals(edge: GEdge, segments: Point[], context: RenderingContext): VNode[] {
        const additionals = super.renderAdditionals(edge, segments, context);
        const p1 = segments[segments.length - 2];
        const p2 = segments[segments.length - 1];
        if (p1 && p2) {
            additionals.push(<path class-sprotty-edge={true} transform={`rotate(${toDegrees(angleOfPoint(Point.subtract(p1, p2)))} ${p2.x} ${p2.y}) translate(${p2.x} ${p2.y})`} />);
        }
        return additionals;
    }
}

@injectable()
export class DisjointnessEdgeView extends PolylineEdgeView {
    protected override renderLine(edge: GEdge, segments: Point[], context: RenderingContext): VNode {
        if (segments.length === 2) {
            return <path class-sprotty-edge={true} class-disjointness-edge={true} d={getCurvedPathData(segments[0], segments[1])} fill="none" />;
        }
        return super.renderLine(edge, segments, context);
    }
}

@injectable()
export class OverlappingEdgeView extends PolylineEdgeView {
    protected override renderLine(edge: GEdge, segments: Point[], context: RenderingContext): VNode {
        if (segments.length === 2) {
            return <path class-sprotty-edge={true} class-overlapping-edge={true} d={getCurvedPathData(segments[0], segments[1])} fill="none" />;
        }
        return super.renderLine(edge, segments, context);
    }

    protected override renderAdditionals(edge: GEdge, segments: Point[], context: RenderingContext): VNode[] {
        const additionals = super.renderAdditionals(edge, segments, context);
        const p1 = segments[segments.length - 2];
        const p2 = segments[segments.length - 1];
        if (p1 && p2) {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const cp = { x: ((p1.x + p2.x) / 2) - (dy / len) * 20, y: ((p1.y + p2.y) / 2) + (dx / len) * 20 };
            const angle = toDegrees(angleOfPoint(Point.subtract(cp, p2)));
            
            additionals.push(<path class-sprotty-edge={true} class-overlapping-arrow={true} d="M 0,0 L 10,-4 L 10,4 Z" transform={`translate(${p2.x} ${p2.y}) rotate(${angle})`} />);
        }
        return additionals;
    }
}

@injectable()
export class InclusionEdgeView extends PolylineEdgeView {
    protected override renderAdditionals(edge: GEdge, segments: Point[], context: RenderingContext): VNode[] {
        const additionals = super.renderAdditionals(edge, segments, context);
        const p1 = segments[segments.length - 2];
        const p2 = segments[segments.length - 1];
        if (p1 && p2) {
            const angle = toDegrees(angleOfPoint(Point.subtract(p1, p2)));
            additionals.push(<path class-sprotty-edge={true} class-inclusion-arrow={true} d="M 0,0 L 10,-4 L 10,4 Z" transform={`rotate(${angle} ${p2.x} ${p2.y}) translate(${p2.x} ${p2.y})`} />);
        }
        return additionals;
    }
}

// Helpers

function getCurvedPathData(p1: Point, p2: Point, offset = 20): string {
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const nx = -(dy / length) * offset;
    const ny = (dx / length) * offset;
    return `M ${p1.x},${p1.y} Q ${midX + nx},${midY + ny} ${p2.x},${p2.y}`;
}

const renderSpecializationTriangle = (w: number, h: number, selected: boolean) => (
    <path
        class-sprotty-node={true}
        class-selected={selected}
        class-specialization-triangle-node={true}
        d={`M ${w / 2},${h} L 0,0 L ${w},0 Z`}
    />
);

const renderExclusiveArc = (w2: number, h: number) => (
    <path
        class-exclusive-arc={true}
        d={`M ${w2 - 25},${h + 2} Q ${w2},${h + 12} ${w2 + 25},${h + 2}`}
        fill="none"
        stroke="var(--sprotty-edge-stroke, #222)"
        stroke-width="var(--sprotty-edge-stroke-width, 2px)"
    />
);

const renderTotalIndicator = (w2: number, lineLength = 15, circleRadius = 8) => (
    <g>
        <path
            class-total-line={true}
            d={`M ${w2},0 L ${w2},${-lineLength}`}
            fill="none"
            stroke="var(--sprotty-edge-stroke, #222)"
            stroke-width="var(--sprotty-edge-stroke-width, 2px)"
        />
        <ellipse
            class-total-circle={true}
            cx={w2}
            cy={-lineLength - circleRadius}
            rx={circleRadius}
            ry={circleRadius}
        />
    </g>
);