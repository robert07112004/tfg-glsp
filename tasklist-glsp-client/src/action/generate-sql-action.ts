import { Action } from '@eclipse-glsp/client';

export interface GenerateSqlAction extends Action {
    kind: typeof GenerateSqlAction.KIND;
}

export namespace GenerateSqlAction {
    export const KIND = 'generateSql';
    
    export function create(): GenerateSqlAction {
        return { kind: KIND };
    }
}