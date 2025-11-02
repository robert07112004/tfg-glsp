
/*export class WeightedEdge extends GEdge implements WithEditableLabel {
    static override readonly DEFAULT_FEATURES = [
        ...GEdge.DEFAULT_FEATURES,
        withEditLabelFeature
    ];

    get editableLabel(): (GLabel & EditableLabel) | undefined {
        return this.children.find(c => c.type === 'label:weighted') as (GLabel & EditableLabel) | undefined;
    }

    get description(): string {
        return this.editableLabel?.text ?? '';
    } 
    
}*/