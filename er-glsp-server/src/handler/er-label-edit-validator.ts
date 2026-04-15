import { GEdge, GModelElement, GNode, LabelEditValidator, toTypeGuard, ValidationStatus } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ErModelState } from '../model/er-model-state';

const CARDINALITY_REGEX = /^\([0-9]+\.\.([0-9]+|N)\)$/;
const EQUATION_REGEX = /^[a-zA-Z0-9_\s+\-*/().]+$/;

const ALLOWED_SQL_TYPES = [
    'integer', 'smallint', 'bigint', 'tinyint',
    'decimal\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)',
    'numeric\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)',
    'float', 'real',
    'varchar\\(\\s*\\d+\\s*\\)', 'char\\(\\s*\\d+\\s*\\)', 'text',
    'date', 'time', 'datetime', 'timestamp',
    'boolean',
    'blob', 'binary', 'varbinary',
    'json', 'xml', 'uuid',
    'geometry', 'geography'
];
const ATTRIBUTE_REGEX = new RegExp(`^[^:]+:\\s*(${ALLOWED_SQL_TYPES.join('|')})\\s*$`, 'i');

function isAttributeNode(elementType: string): boolean {
    return [
        'node:attribute',
        'node:keyAttribute',
        'node:alternativeKeyAttribute',
        'node:multiValuedAttribute',
        'node:derivedAttribute'
    ].includes(elementType);
}

/**
 * A simple edit label validator that verifies that the given name label is not empty.
 */
@injectable()
export class ErLabelEditValidator implements LabelEditValidator {
    @inject(ErModelState)
    protected modelState: ErModelState;

    validate(label: string, element: GModelElement): ValidationStatus {
        const index = this.modelState.index;

        const trimmedLabel = label.trim();
        if (trimmedLabel.length < 1 || (trimmedLabel.includes(':') && trimmedLabel.split(':')[0].trim().length < 1)) {
            return { severity: ValidationStatus.Severity.ERROR, message: 'Name must not be empty.' };
        }

        const container = element.type.startsWith('label')
            ? (index.findParentElement(element.id, toTypeGuard(GNode)) ?? index.findParentElement(element.id, toTypeGuard(GEdge)))
            : element;

        if (!container) {
            return { severity: ValidationStatus.Severity.OK };
        }

        if (container instanceof GEdge) {
            const weightedEdge = index.findWeightedEdge(container.id);
            if (weightedEdge && !CARDINALITY_REGEX.test(label)) {
                return {
                    severity: ValidationStatus.Severity.ERROR,
                    message: 'El formato no es correcto, por favor utilice (1..N) or (0..1).'
                };
            }
        } else if (container instanceof GNode && isAttributeNode(container.type)) {
            if (element.id.endsWith('_equation_label')) {
                if (!EQUATION_REGEX.test(label)) {
                    return {
                        severity: ValidationStatus.Severity.ERROR,
                        message: 'Fórmula incorrecta, por favor solo utilice atributos, números y operadores (+ - * /).'
                    };
                }
            } else {
                if (!ATTRIBUTE_REGEX.test(label)) {
                    return {
                        severity: ValidationStatus.Severity.ERROR,
                        message: 'El formato no es correcto, por favor utilice (solo tipos de SQL): {name: type} (ex. "age: integer")'
                    };
                }
            }
        }

        return { severity: ValidationStatus.Severity.OK };
    }
}
