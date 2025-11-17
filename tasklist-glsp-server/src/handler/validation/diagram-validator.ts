import {
    AbstractModelValidator,
    GModelElement,
    GNode,
    Marker
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../model/tasklist-model-index';
import { TaskListModelState } from '../../model/tasklist-model-state';
import { ATTRIBUTE_TYPE, DERIVED_ATTRIBUTE_TYPE, ENTITY_TYPE, EXISTENCE_DEP_RELATION_TYPE, IDENTIFYING_DEP_RELATION_TYPE, KEY_ATTRIBUTE_TYPE, MULTI_VALUED_ATTRIBUTE_TYPE, RELATION_TYPE, WEAK_ENTITY_TYPE } from './utils/validation-constants';
import { AttributeValidator } from './validators/attribute-validator';
import { DerivedAttributeValidator } from './validators/derived-attribute-validator';
import { EntityValidator } from './validators/entity-validator';
import { ExistenceDependenceRelationValidator } from './validators/existence-dependence-relation';
import { IdentifyingDependenceRelationValidator } from './validators/identifying-dependence-relation';
import { KeyAttributeValidator } from './validators/key-attribute-validator';
import { MultiValuedAttributeValidator } from './validators/multi-valued-attribute';
import { RelationValidator } from './validators/relation-validator';
import { WeakEntityValidator } from './validators/weak-entity-validator';

@injectable()
export class TaskListModelValidator extends AbstractModelValidator {
    
    @inject(TaskListModelState)
    protected readonly modelState!: TaskListModelState;

    protected get index(): TaskListModelIndex {
        return this.modelState.index as TaskListModelIndex;
    }

    @inject(EntityValidator)
    private entityValidator!: EntityValidator;

    @inject(WeakEntityValidator)
    private weakEntityValidator!: WeakEntityValidator;

    @inject(RelationValidator)
    private relationValidator!: RelationValidator;

    @inject(AttributeValidator)
    private attributeValidator!: AttributeValidator;

    @inject(KeyAttributeValidator)
    private keyAttributeValidator!: KeyAttributeValidator;

    @inject(DerivedAttributeValidator)
    private derivedAttributeValidator!: DerivedAttributeValidator;

    @inject(MultiValuedAttributeValidator)
    private multiValuedAttributeValidator!: MultiValuedAttributeValidator;

    @inject(ExistenceDependenceRelationValidator)
    private existenceDependenceRelationValidator!: ExistenceDependenceRelationValidator;

    @inject(IdentifyingDependenceRelationValidator)
    private identifyingDependenceRelationValidator!: IdentifyingDependenceRelationValidator;

    protected readonly validationMap = new Map<string, (node: GNode) => Marker | undefined>([
        [ENTITY_TYPE, (node) => this.entityValidator.validate(node)],
        [WEAK_ENTITY_TYPE, (node) => this.weakEntityValidator.validate(node)],
        [RELATION_TYPE, (node) => this.relationValidator.validate(node)],
        [ATTRIBUTE_TYPE, (node) => this.attributeValidator.validate(node)],
        [KEY_ATTRIBUTE_TYPE, (node) => this.keyAttributeValidator.validate(node)],
        [DERIVED_ATTRIBUTE_TYPE, (node) => this.derivedAttributeValidator.validate(node)],
        [MULTI_VALUED_ATTRIBUTE_TYPE, (node) => this.multiValuedAttributeValidator.validate(node)],
        [EXISTENCE_DEP_RELATION_TYPE, (node) => this.existenceDependenceRelationValidator.validate(node)],
        [IDENTIFYING_DEP_RELATION_TYPE, (node) => this.identifyingDependenceRelationValidator.validate(node)]
    ]);

    override doBatchValidation(element: GModelElement): Marker[] {
        if (!(element instanceof GNode)) return [];
        
        const validator = this.validationMap.get(element.type);
        if (validator) {
            const marker = validator(element);
            return marker ? [marker] : [];
        }
        
        return [];
    }

}
