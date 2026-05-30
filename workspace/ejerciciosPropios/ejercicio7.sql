-- Fecha: 29/5/2026, 18:58:23

CREATE TABLE empleado (
    cod_empl INTEGER NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    titulacion VARCHAR(20) NOT NULL,
    DNI VARCHAR(9) UNIQUE NOT NULL,
    tipo_empleado ENUM('jefe_proyecto', 'informatico', 'Otro') NULL,
    PRIMARY KEY (cod_empl),
    UNIQUE (cod_empl, tipo_empleado)
);

CREATE TABLE jefe_proyecto (
    cod_empl INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'jefe_proyecto' NOT NULL,
    PRIMARY KEY (cod_empl),
    CHECK (tipo = 'jefe_proyecto'),
    FOREIGN KEY (cod_empl, tipo) REFERENCES empleado(cod_empl, tipo_empleado) ON DELETE CASCADE
);

CREATE TABLE informatico (
    cod_empl INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'informatico' NOT NULL,
    tipo_informatico ENUM('analista', 'programador') NOT NULL,
    PRIMARY KEY (cod_empl),
    CHECK (tipo = 'informatico'),
    UNIQUE (cod_empl, tipo_informatico),
    FOREIGN KEY (cod_empl, tipo) REFERENCES empleado(cod_empl, tipo_empleado) ON DELETE CASCADE
);

CREATE TABLE analista (
    cod_empl INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'analista' NOT NULL,
    PRIMARY KEY (cod_empl),
    CHECK (tipo = 'analista'),
    FOREIGN KEY (cod_empl, tipo) REFERENCES informatico(cod_empl, tipo_informatico) ON DELETE CASCADE
);

CREATE TABLE programador (
    cod_empl INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'programador' NOT NULL,
    PRIMARY KEY (cod_empl),
    CHECK (tipo = 'programador'),
    FOREIGN KEY (cod_empl, tipo) REFERENCES informatico(cod_empl, tipo_informatico) ON DELETE CASCADE
);

CREATE TABLE programador_lenguaje (
    cod_empl INTEGER NOT NULL,
    lenguaje VARCHAR(20) NOT NULL,
    PRIMARY KEY (cod_empl, lenguaje),
    FOREIGN KEY (cod_empl) REFERENCES programador(cod_empl) ON DELETE CASCADE
);

CREATE TABLE producto (
    cod_pr VARCHAR(20) NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    descripcion VARCHAR(20) NOT NULL,
    es_software BOOLEAN DEFAULT FALSE NOT NULL,
    es_prototipo BOOLEAN DEFAULT FALSE NOT NULL,
    analista_cod_empl INTEGER NULL,
    PRIMARY KEY (cod_pr),
    UNIQUE (cod_pr, es_software),
    UNIQUE (cod_pr, es_prototipo),
    FOREIGN KEY (analista_cod_empl) REFERENCES analista(cod_empl) ON DELETE SET NULL
);

CREATE TABLE software (
    cod_pr VARCHAR(20) NOT NULL,
    tipo BOOLEAN DEFAULT TRUE NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    PRIMARY KEY (cod_pr),
    CHECK (tipo = TRUE),
    FOREIGN KEY (cod_pr, tipo) REFERENCES producto(cod_pr, es_software) ON DELETE CASCADE
);

CREATE TABLE prototipo (
    cod_pr VARCHAR(20) NOT NULL,
    tipo BOOLEAN DEFAULT TRUE NOT NULL,
    version VARCHAR(20) NOT NULL,
    PRIMARY KEY (cod_pr),
    CHECK (tipo = TRUE),
    FOREIGN KEY (cod_pr, tipo) REFERENCES producto(cod_pr, es_prototipo) ON DELETE CASCADE
);

CREATE TABLE recurso (
    cod_recurso INTEGER NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    descripcion VARCHAR(20) NOT NULL,
    PRIMARY KEY (cod_recurso)
);

CREATE TABLE proyecto (
    cod_proy INTEGER NOT NULL,
    descripcion VARCHAR(20) NOT NULL,
    cliente VARCHAR(20) NOT NULL,
    presupuesto FLOAT NOT NULL,
    nombre VARCHAR(20) UNIQUE NOT NULL,
    jefe_proyecto_cod_empl INTEGER NOT NULL,
    num_horas INTEGER NOT NULL,
    coste_total FLOAT NOT NULL,
    PRIMARY KEY (cod_proy),
    FOREIGN KEY (jefe_proyecto_cod_empl) REFERENCES jefe_proyecto(cod_empl) ON DELETE NO ACTION
);

CREATE TABLE gasto (
    cod_gasto INTEGER NOT NULL,
    proyecto_cod_proy INTEGER NULL,
    empleado_cod_empl INTEGER NULL,
    PRIMARY KEY (cod_gasto),
    FOREIGN KEY (proyecto_cod_proy) REFERENCES proyecto(cod_proy) ON DELETE SET NULL,
    FOREIGN KEY (empleado_cod_empl) REFERENCES empleado(cod_empl) ON DELETE SET NULL
);

CREATE TABLE fase (
    num_fase INTEGER NOT NULL,
    proyecto_cod_proy INTEGER NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    fecha_i DATE NOT NULL,
    fecha_f DATE NOT NULL,
    PRIMARY KEY (num_fase, proyecto_cod_proy),
    FOREIGN KEY (proyecto_cod_proy) REFERENCES proyecto(cod_proy) ON DELETE CASCADE
);

CREATE TABLE relacionado_con (
    proyecto_cod_proy_1 INTEGER NOT NULL,
    proyecto_cod_proy_2 INTEGER NOT NULL,
    PRIMARY KEY (proyecto_cod_proy_1, proyecto_cod_proy_2),
    FOREIGN KEY (proyecto_cod_proy_1) REFERENCES proyecto(cod_proy) ON DELETE CASCADE,
    FOREIGN KEY (proyecto_cod_proy_2) REFERENCES proyecto(cod_proy) ON DELETE CASCADE
);

CREATE TABLE relacionado_con_keyword (
    proyecto_cod_proy_1 INTEGER NOT NULL,
    proyecto_cod_proy_2 INTEGER NOT NULL,
    keyword VARCHAR(20) NOT NULL,
    PRIMARY KEY (proyecto_cod_proy_1, proyecto_cod_proy_2, keyword),
    FOREIGN KEY (proyecto_cod_proy_1, proyecto_cod_proy_2) REFERENCES relacionado_con(proyecto_cod_proy_1, proyecto_cod_proy_2) ON DELETE CASCADE
);

CREATE TABLE trabaja (
    proyecto_cod_proy INTEGER NOT NULL,
    informatico_cod_empl INTEGER NOT NULL,
    num_horas INTEGER NOT NULL,
    coste_total FLOAT NOT NULL,
    PRIMARY KEY (proyecto_cod_proy, informatico_cod_empl),
    FOREIGN KEY (proyecto_cod_proy) REFERENCES proyecto(cod_proy) ON DELETE CASCADE,
    FOREIGN KEY (informatico_cod_empl) REFERENCES informatico(cod_empl) ON DELETE CASCADE
);

CREATE TABLE genera (
    producto_cod_pr VARCHAR(20) NOT NULL,
    fase_num_fase INTEGER NOT NULL,
    fase_proyecto_cod_proy INTEGER NOT NULL,
    PRIMARY KEY (producto_cod_pr, fase_num_fase, fase_proyecto_cod_proy),
    FOREIGN KEY (producto_cod_pr) REFERENCES producto(cod_pr) ON DELETE CASCADE,
    FOREIGN KEY (fase_num_fase, fase_proyecto_cod_proy) REFERENCES fase(num_fase, proyecto_cod_proy) ON DELETE CASCADE
);

CREATE TABLE involucrado_en (
    jefe_proyecto_cod_empl INTEGER NOT NULL,
    producto_cod_pr VARCHAR(20) NOT NULL,
    fase_num_fase INTEGER NOT NULL,
    fase_proyecto_cod_proy INTEGER NOT NULL,
    num_horas INTEGER NOT NULL,
    PRIMARY KEY (jefe_proyecto_cod_empl, producto_cod_pr, fase_num_fase, fase_proyecto_cod_proy),
    FOREIGN KEY (jefe_proyecto_cod_empl) REFERENCES jefe_proyecto(cod_empl) ON DELETE CASCADE,
    FOREIGN KEY (producto_cod_pr) REFERENCES producto(cod_pr) ON DELETE CASCADE,
    FOREIGN KEY (fase_num_fase, fase_proyecto_cod_proy) REFERENCES fase(num_fase, proyecto_cod_proy) ON DELETE CASCADE
);

CREATE TABLE se_asigna (
    fase_num_fase INTEGER NOT NULL,
    fase_proyecto_cod_proy INTEGER NOT NULL,
    recurso_cod_recurso INTEGER NOT NULL,
    fecha_i DATE NOT NULL,
    fecha_f DATE NOT NULL,
    PRIMARY KEY (fase_num_fase, fase_proyecto_cod_proy, recurso_cod_recurso),
    FOREIGN KEY (fase_num_fase, fase_proyecto_cod_proy) REFERENCES fase(num_fase, proyecto_cod_proy) ON DELETE CASCADE,
    FOREIGN KEY (recurso_cod_recurso) REFERENCES recurso(cod_recurso) ON DELETE CASCADE
);

