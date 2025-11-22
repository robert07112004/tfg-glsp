/********************************************************************************
 * Copyright (c) 2022 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied:
 * -- GNU General Public License, version 2 with the GNU Classpath Exception
 * which is available at https://www.gnu.org/software/classpath/license.html
 * -- MIT License which is available at https://opensource.org/license/mit.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0 OR MIT
 ********************************************************************************/
import { GEdge, GLabel, GModelElement, GNode, LabelEditValidator, ValidationStatus } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { TaskListModelState } from '../model/tasklist-model-state';

// Custom type guards
function isEdge(element: GModelElement): element is GEdge {
    return element.type === 'edge' || element.type.startsWith('edge:');
}

function isLabel(element: GModelElement): element is GLabel {
    return element.type === 'label' || element.type.startsWith('label:');
}

function isNode(element: GModelElement): element is GNode {
    return element.type === 'node' || element.type.startsWith('node:');
}

function isAttributeNode(elementType: string): boolean {
    const attributeTypes = [
        'node:attribute',
        'node:keyAttribute',
        'node:alternativeKeyAttribute',
        'node:multiValuedAttribute',
        'node:derivedAttribute'
    ];
    return attributeTypes.includes(elementType);
}

/**
 * A simple edit label validator that verifies that the given name label is not empty.
 */
@injectable()
export class TaskListLabelEditValidator implements LabelEditValidator {
    @inject(TaskListModelState)
    protected modelState: TaskListModelState;

    protected findParentElement(elementId: string): GModelElement | undefined {
        const find = (element: GModelElement): GModelElement | undefined => {
            if (element.children) {
                for (const child of element.children) {
                    if (child.id === elementId) {
                        return element;
                    }
                    const found = find(child);
                    if (found) {
                        return found;
                    }
                }
            }
            return undefined;
        };
        return find(this.modelState.root);
    }

    validate(label: string, element: GModelElement): ValidationStatus {
        const container = isLabel(element) ? this.findParentElement(element.id) : element;

        if (container && isEdge(container)) {
            const weightedEdge = this.modelState.index.findWeightedEdge(container.id);
            if (weightedEdge) {
                const regex = /^\([0-9]+\.\.([0-9]+|N)\)$/;
                if (!regex.test(label)) {
                    return {
                        severity: ValidationStatus.Severity.ERROR,
                        message: 'The format is not correct, please follow the format (1..N) or (0..1).'
                    };
                }
            }
        } else if (container && isNode(container) && isAttributeNode(container.type)) {
            if (element.id.endsWith('_equation_label')) {
                const equationRegex = /^[a-zA-Z0-9_\s+\-*/().]+$/;
                if (!equationRegex.test(label)) {
                    return {
                        severity: ValidationStatus.Severity.ERROR,
                        message: 'Invalid formula. Only attributes, numbers and operators (+ - * /) are allowed.'
                    };
                }
            } else {
                const allowedTypes = [
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
                const typesRegex = `(${allowedTypes.join('|')})`;
                const attributeRegex = new RegExp(`^[^:]+:\\s*${typesRegex}\\s*$`, 'i');
                if (!attributeRegex.test(label)) {
                    return {
                        severity: ValidationStatus.Severity.ERROR,
                        message: 'The format is not correct, please follow the format: {name: type} with SQL types (ex. "age: integer")'
                    };
                }
            }
        }

        if (label.trim().length < 1 || label.includes(':') && label.split(':')[0].trim().length < 1) {
            return { severity: ValidationStatus.Severity.ERROR, message: 'Name must not be empty.' };
        }

        return { severity: ValidationStatus.Severity.OK };
    }

}
