import { AlternativeKeyAttribute, Attribute, KeyAttribute, MultiValuedAttribute } from '../../model/er-model';

// Representa una columna que forma parte de la clave primaria completa de una entidad.
// "colNameInThisTable" es el nombre real de la columna en la tabla actual.
// "introducer" es la entidad que originó esta PK (para evitar el efecto Matrioska).
// "originalName" es el nombre original del atributo en su entidad de origen.
export interface FullPK {
    colNameInThisTable: string;
    introducer: string;
    originalName: string;
    type: string;
}

// Todos los atributos clasificados de un nodo (entidad o relación).
export interface AllAttributes {
    pk: KeyAttribute[];
    unique: AlternativeKeyAttribute[];
    simple: Attribute[];
    optional: Attribute[];
    multiValued: MultiValuedAttribute[];
}

// Resultado de transformar cualquier elemento del modelo en una tabla SQL.
// "dependencies" contiene los nombres de las tablas a las que esta tabla hace referencia
// mediante FOREIGN KEY, necesario para el ordenamiento topológico.
export interface GeneratedTable {
    name: string;
    sql: string;
    dependencies: string[];
}

// Datos de una especialización pre-computados para evitar recalcularlos por cada entidad.
export interface SpecInfo {
    specType: string;       // Tipo de nodo: 'partialExclusiveSpecialization', etc.
    fatherId: string;
    fatherName: string;
    childrenIds: string[];
    childNames: string[];   // Nombres de las subclases (para valores ENUM / columnas booleanas)
    discriminatorCol?: string; // Nombre real de la columna discriminadora en la tabla padre (solo exclusivas).
                               // Cuando un padre tiene más de una jerarquía exclusiva se añade sufijo _2, _3...
}
