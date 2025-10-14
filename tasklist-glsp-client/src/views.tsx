/** @jsx svg */
import {
    angleOfPoint,
    GEdge,
    GLabel,
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

        const label = edge.children.find(c => c.type === 'label:weighted') as GLabel | undefined;
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
            }

        return additionals;
    }
}
