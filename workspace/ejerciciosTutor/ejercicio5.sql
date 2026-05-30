-- Fecha: 24/5/2026, 23:54:18

CREATE TABLE competencia (
    codigo INTEGER NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    descripcion VARCHAR(20) NOT NULL,
    tipo_competencia ENUM('emocional', 'intelectual') NOT NULL,
    PRIMARY KEY (codigo),
    UNIQUE (codigo, tipo_competencia)
);

CREATE TABLE emocional (
    codigo INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'emocional' NOT NULL,
    PRIMARY KEY (codigo),
    CHECK (tipo = 'emocional'),
    FOREIGN KEY (codigo, tipo) REFERENCES competencia(codigo, tipo_competencia) ON DELETE CASCADE
);

CREATE TABLE intelectual (
    codigo INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'intelectual' NOT NULL,
    PRIMARY KEY (codigo),
    CHECK (tipo = 'intelectual'),
    FOREIGN KEY (codigo, tipo) REFERENCES competencia(codigo, tipo_competencia) ON DELETE CASCADE
);

CREATE TABLE empleado (
    codigo INTEGER NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    dir VARCHAR(20) NOT NULL,
    tlf VARCHAR(9) NOT NULL,
    es_directivo BOOLEAN DEFAULT FALSE NOT NULL,
    PRIMARY KEY (codigo),
    UNIQUE (codigo, es_directivo)
);

CREATE TABLE directivo (
    codigo INTEGER NOT NULL,
    tipo BOOLEAN DEFAULT TRUE NOT NULL,
    PRIMARY KEY (codigo),
    CHECK (tipo = TRUE),
    FOREIGN KEY (codigo, tipo) REFERENCES empleado(codigo, es_directivo) ON DELETE CASCADE
);

CREATE TABLE posee (
    intelectual_codigo INTEGER NOT NULL,
    empleado_codigo INTEGER NOT NULL,
    grado VARCHAR(20) NOT NULL,
    PRIMARY KEY (intelectual_codigo, empleado_codigo),
    FOREIGN KEY (intelectual_codigo) REFERENCES intelectual(codigo) ON DELETE CASCADE,
    FOREIGN KEY (empleado_codigo) REFERENCES empleado(codigo) ON DELETE CASCADE
);

CREATE TABLE tiene (
    directivo_codigo INTEGER NOT NULL,
    emocional_codigo INTEGER NOT NULL,
    grado VARCHAR(20) NOT NULL,
    PRIMARY KEY (directivo_codigo, emocional_codigo),
    FOREIGN KEY (directivo_codigo) REFERENCES directivo(codigo) ON DELETE CASCADE,
    FOREIGN KEY (emocional_codigo) REFERENCES emocional(codigo) ON DELETE CASCADE
);

CREATE TABLE test (
    cod_test INTEGER NOT NULL,
    plantilla VARCHAR(20) NOT NULL,
    interpretacion VARCHAR(20) NOT NULL,
    competencia_codigo INTEGER NOT NULL,
    PRIMARY KEY (cod_test),
    FOREIGN KEY (competencia_codigo) REFERENCES competencia(codigo) ON DELETE NO ACTION
);

CREATE TABLE test_pregunta (
    cod_test INTEGER NOT NULL,
    pregunta VARCHAR(20) NOT NULL,
    PRIMARY KEY (cod_test, pregunta),
    FOREIGN KEY (cod_test) REFERENCES test(cod_test) ON DELETE CASCADE
);

