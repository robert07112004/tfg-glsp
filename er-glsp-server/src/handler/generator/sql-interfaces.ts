import { AlternativeKeyAttribute, Attribute, KeyAttribute, MultiValuedAttribute } from '../../model/er-model';

// Represents a propagated PK column
export interface FullPK {
    colNameInThisTable: string;
    introducer: string;
    originalName: string;
    type: string;
}

export interface AllAttributes {
    pk: KeyAttribute[];
    unique: AlternativeKeyAttribute[];
    simple: Attribute[];
    optional: Attribute[];
    multiValued: MultiValuedAttribute[];
}

export interface GeneratedTable {
    name: string;
    sql: string;
    dependencies: string[];
}

// Calculated data for a specialization node
export interface SpecInfo {
    specType: string;
    fatherId: string;
    fatherName: string;
    childrenIds: string[];
    childNames: string[];
    discriminatorCol?: string;
}
