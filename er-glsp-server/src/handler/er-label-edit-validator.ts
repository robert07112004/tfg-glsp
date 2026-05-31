import { GEdge, GModelElement, GNode, LabelEditValidator, toTypeGuard, ValidationStatus } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { ErModelState } from '../model/er-model-state';

const CARDINALITY_REGEX = /^\([0-9]+\.\.([0-9]+|N)\)$/;
const EQUATION_REGEX = /^[a-zA-Z0-9_\s+\-*/().]+$/;

const ALLOWED_SQL_TYPES = [
    'tinyint', 'smallint', 'mediumint', 'int', 'bigint',
    'tinyint\\(\\s*\\d+\\s*\\)', 'smallint\\(\\s*\\d+\\s*\\)',
    'mediumint\\(\\s*\\d+\\s*\\)', 'int\\(\\s*\\d+\\s*\\)', 'bigint\\(\\s*\\d+\\s*\\)',

    'decimal\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)',
    'numeric\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)',
    'decimal\\(\\s*\\d+\\s*\\)',
    'numeric\\(\\s*\\d+\\s*\\)',

    'float', 'float\\(\\s*\\d+\\s*\\)',
    'double', 'double\\(\\s*\\d+\\s*,\\s*\\d+\\s*\\)',
    'real',

    'char\\(\\s*\\d+\\s*\\)', 'varchar\\(\\s*\\d+\\s*\\)',
    'tinytext', 'text', 'mediumtext', 'longtext',

    'binary\\(\\s*\\d+\\s*\\)', 'varbinary\\(\\s*\\d+\\s*\\)',
    'tinyblob', 'blob', 'mediumblob', 'longblob',

    'date', 'time', 'datetime', 'timestamp', 'year',

    'boolean', 'bool',

    'json',

    "enum\\(\\s*('[^']*'\\s*,\\s*)*'[^']*'\\s*\\)",
    "set\\(\\s*('[^']*'\\s*,\\s*)*'[^']*'\\s*\\)"
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


// Verifies that the given name label is not empty
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
                        message: 'El formato no es correcto, por favor utilice (solo tipos de SQL): {name: type} (ex. "age: int")'
                    };
                }
            }
        }

        return { severity: ValidationStatus.Severity.OK };
    }
}
