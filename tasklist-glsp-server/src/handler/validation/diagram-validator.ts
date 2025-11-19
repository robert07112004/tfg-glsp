import {
    AbstractModelValidator,
    GModelElement,
    GNode,
    Marker
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelIndex } from '../../model/tasklist-model-index';
import { TaskListModelState } from '../../model/tasklist-model-state';
import { ATTRIBUTE_TYPE, DERIVED_ATTRIBUTE_TYPE, ENTITY_TYPE, EXISTENCE_DEP_RELATION_TYPE, IDENTIFYING_DEP_RELATION_TYPE, KEY_ATTRIBUTE_TYPE, MULTI_VALUED_ATTRIBUTE_TYPE, PARTIAL_EXCLUSIVE_SPECIALIZATION_TYPE, PARTIAL_OVERLAPPED_SPECIALIZATION_TYPE, RELATION_TYPE, TOTAL_EXCLUSIVE_SPECIALIZATION_TYPE, TOTAL_OVERLAPPED_SPECIALIZATION_TYPE, WEAK_ENTITY_TYPE } from './utils/validation-constants';
import { AttributeValidator } from './validators/attribute-validators/attribute-validator';
import { DerivedAttributeValidator } from './validators/attribute-validators/derived-attribute-validator';
import { KeyAttributeValidator } from './validators/attribute-validators/key-attribute-validator';
import { MultiValuedAttributeValidator } from './validators/attribute-validators/multi-valued-attribute';
import { EntityValidator } from './validators/entity-validators/entity-validator';
import { WeakEntityValidator } from './validators/entity-validators/weak-entity-validator';
import { ExistenceDependenceRelationValidator } from './validators/relation-validators/existence-dependence-relation';
import { IdentifyingDependenceRelationValidator } from './validators/relation-validators/identifying-dependence-relation';
import { RelationValidator } from './validators/relation-validators/relation-validator';
import { AllSpecializationsValidator } from './validators/specialization-validators/all-specializations-validator';

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

    @inject(AllSpecializationsValidator)
    private allSpecializationsValidator!: AllSpecializationsValidator;

    protected readonly validationMap = new Map<string, (node: GNode) => Marker | undefined>([
        [ENTITY_TYPE, (node) => this.entityValidator.validate(node)],
        [WEAK_ENTITY_TYPE, (node) => this.weakEntityValidator.validate(node)],
        [RELATION_TYPE, (node) => this.relationValidator.validate(node)],
        [ATTRIBUTE_TYPE, (node) => this.attributeValidator.validate(node)],
        [KEY_ATTRIBUTE_TYPE, (node) => this.keyAttributeValidator.validate(node)],
        [DERIVED_ATTRIBUTE_TYPE, (node) => this.derivedAttributeValidator.validate(node)],
        [MULTI_VALUED_ATTRIBUTE_TYPE, (node) => this.multiValuedAttributeValidator.validate(node)],
        [EXISTENCE_DEP_RELATION_TYPE, (node) => this.existenceDependenceRelationValidator.validate(node)],
        [IDENTIFYING_DEP_RELATION_TYPE, (node) => this.identifyingDependenceRelationValidator.validate(node)],
        [PARTIAL_EXCLUSIVE_SPECIALIZATION_TYPE, (node) => this.allSpecializationsValidator.validate(node)],
        [TOTAL_EXCLUSIVE_SPECIALIZATION_TYPE, (node) => this.allSpecializationsValidator.validate(node)],
        [PARTIAL_OVERLAPPED_SPECIALIZATION_TYPE, (node) => this.allSpecializationsValidator.validate(node)],
        [TOTAL_OVERLAPPED_SPECIALIZATION_TYPE, (node) => this.allSpecializationsValidator.validate(node)]
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
