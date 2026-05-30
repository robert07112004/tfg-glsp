-- Fecha: 24/5/2026, 22:15:27

CREATE TABLE curso (
    cod_c INTEGER NOT NULL,
    PRIMARY KEY (cod_c)
);

CREATE TABLE empleado (
    cod_c INTEGER NOT NULL,
    PRIMARY KEY (cod_c)
);

CREATE TABLE edicion (
    cod_edicion INTEGER NOT NULL,
    curso_cod_c INTEGER NULL,
    PRIMARY KEY (cod_edicion),
    FOREIGN KEY (curso_cod_c) REFERENCES curso(cod_c) ON DELETE SET NULL
);

CREATE TABLE participa (
    edicion_cod_edicion INTEGER NOT NULL,
    empleado_cod_c INTEGER NOT NULL,
    tipo_p VARCHAR(20) NOT NULL,
    PRIMARY KEY (edicion_cod_edicion, empleado_cod_c),
    FOREIGN KEY (edicion_cod_edicion) REFERENCES edicion(cod_edicion) ON DELETE CASCADE,
    FOREIGN KEY (empleado_cod_c) REFERENCES empleado(cod_c) ON DELETE CASCADE
);

CREATE TABLE prerrequisito (
    curso_cod_c_1 INTEGER NOT NULL,
    curso_cod_c_2 INTEGER NOT NULL,
    opcional BOOLEAN NOT NULL,
    PRIMARY KEY (curso_cod_c_1, curso_cod_c_2),
    FOREIGN KEY (curso_cod_c_1) REFERENCES curso(cod_c) ON DELETE CASCADE,
    FOREIGN KEY (curso_cod_c_2) REFERENCES curso(cod_c) ON DELETE CASCADE
);

