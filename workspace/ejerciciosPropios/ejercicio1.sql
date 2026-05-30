-- Fecha: 26/5/2026, 19:02:12

CREATE TABLE propietario (
    NIF VARCHAR(9) NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    dir VARCHAR(20) NOT NULL,
    email VARCHAR(20) NULL,
    PRIMARY KEY (NIF)
);

CREATE TABLE agencia (
    cod_agencia INTEGER NOT NULL,
    dir VARCHAR(20) NOT NULL,
    CIF VARCHAR(20) UNIQUE NOT NULL,
    PRIMARY KEY (cod_agencia)
);

CREATE TABLE inquilino (
    NIF VARCHAR(20) NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    tlf VARCHAR(9) NOT NULL,
    fecha_nac DATE NOT NULL,
    PRIMARY KEY (NIF)
);

CREATE TABLE vivienda (
    cod_vivienda INTEGER NOT NULL,
    calle VARCHAR(20) NOT NULL,
    numero INTEGER NOT NULL,
    piso INTEGER NOT NULL,
    propietario_NIF VARCHAR(9) NOT NULL,
    agencia_cod_agencia INTEGER NULL,
    PRIMARY KEY (cod_vivienda),
    FOREIGN KEY (propietario_NIF) REFERENCES propietario(NIF) ON DELETE NO ACTION,
    FOREIGN KEY (agencia_cod_agencia) REFERENCES agencia(cod_agencia) ON DELETE SET NULL
);

CREATE TABLE alquiler (
    cod_alquiler INTEGER NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    fecha_firma DATE NOT NULL,
    importe_mens FLOAT NOT NULL,
    vivienda_cod_vivienda INTEGER NULL,
    renovacion_cod_alquiler INTEGER NULL,
    inquilino_NIF VARCHAR(20) NULL,
    PRIMARY KEY (cod_alquiler),
    UNIQUE (renovacion_cod_alquiler),
    FOREIGN KEY (vivienda_cod_vivienda) REFERENCES vivienda(cod_vivienda) ON DELETE SET NULL,
    FOREIGN KEY (renovacion_cod_alquiler) REFERENCES alquiler(cod_alquiler) ON DELETE SET NULL,
    FOREIGN KEY (inquilino_NIF) REFERENCES inquilino(NIF) ON DELETE SET NULL
);

