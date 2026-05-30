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

// Entities
@injectable()
export class WeakEntityView implements IView {
    render(node: GNode, context: RenderingContext): VNode {
        const p = 6;
        return <g class-weak-entity-node={true}>
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
            <line class-alternative-key-line={true} x1={cx * 0.3} y1={cy + 7} x2={cx * 1.7} y2={cy + 7} />
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
            <ellipse class-multi-valued-attribute-node-inner={true} cx={cx} cy={cy} rx={Math.max(0, cx - 4)} ry={Math.max(0, cy - 4)} />
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

// Helpers
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

const renderTotalIndicator = (w2: number, lineLength = 15, circleRadius = 9) => (
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