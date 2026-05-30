-- Fecha: 27/5/2026, 20:14:26

CREATE TABLE profesor (
    dni VARCHAR(20) NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    despacho VARCHAR(20) NOT NULL,
    PRIMARY KEY (dni)
);

CREATE TABLE categoria (
    tipo VARCHAR(20) NOT NULL,
    dedicacion VARCHAR(20) NOT NULL,
    PRIMARY KEY (tipo)
);

CREATE TABLE pais (
    cod_pais INTEGER NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    PRIMARY KEY (cod_pais)
);

CREATE TABLE viaje (
    cod_viaje INTEGER NOT NULL,
    motivo VARCHAR(20) NOT NULL,
    ciudad_o VARCHAR(20) NOT NULL,
    ciudad_d VARCHAR(20) NOT NULL,
    fecha_i DATE NOT NULL,
    fecha_d DATE NOT NULL,
    pais_cod_pais INTEGER NULL,
    profesor_dni VARCHAR(20) NOT NULL,
    PRIMARY KEY (cod_viaje),
    FOREIGN KEY (pais_cod_pais) REFERENCES pais(cod_pais) ON DELETE SET NULL,
    FOREIGN KEY (profesor_dni) REFERENCES profesor(dni) ON DELETE CASCADE
);

CREATE TABLE pertenece (
    profesor_dni VARCHAR(20) NOT NULL,
    categoria_tipo VARCHAR(20) NOT NULL,
    PRIMARY KEY (profesor_dni, categoria_tipo),
    FOREIGN KEY (profesor_dni) REFERENCES profesor(dni) ON DELETE CASCADE,
    FOREIGN KEY (categoria_tipo) REFERENCES categoria(tipo) ON DELETE CASCADE
);

CREATE TABLE pertenece_periodo (
    profesor_dni VARCHAR(20) NOT NULL,
    categoria_tipo VARCHAR(20) NOT NULL,
    fecha_i DATE NOT NULL,
    fecha_f DATE NULL,
    PRIMARY KEY (profesor_dni, categoria_tipo, fecha_i),
    FOREIGN KEY (profesor_dni, categoria_tipo) REFERENCES pertenece(profesor_dni, categoria_tipo) ON DELETE CASCADE
);

CREATE TABLE dieta_diaria (
    categoria_tipo VARCHAR(20) NOT NULL,
    pais_cod_pais INTEGER NOT NULL,
    PRIMARY KEY (categoria_tipo, pais_cod_pais),
    FOREIGN KEY (categoria_tipo) REFERENCES categoria(tipo) ON DELETE CASCADE,
    FOREIGN KEY (pais_cod_pais) REFERENCES pais(cod_pais) ON DELETE CASCADE
);

CREATE TABLE dieta_diaria_dieta (
    categoria_tipo VARCHAR(20) NOT NULL,
    pais_cod_pais INTEGER NOT NULL,
    fecha_i DATE NOT NULL,
    manutencion FLOAT NOT NULL,
    alojamiento FLOAT NOT NULL,
    fecha_f DATE NULL,
    PRIMARY KEY (categoria_tipo, pais_cod_pais, fecha_i, manutencion, alojamiento),
    FOREIGN KEY (categoria_tipo, pais_cod_pais) REFERENCES dieta_diaria(categoria_tipo, pais_cod_pais) ON DELETE CASCADE
);

