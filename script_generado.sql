-- Fecha: 25/2/2026, 19:15:54

CREATE TABLE Profesor (
    nombre VARCHAR(20) NOT NULL PRIMARY KEY
);

CREATE TABLE Linea_Investigacion (
    codigo INTEGER NOT NULL PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL
);

CREATE TABLE Linea_Investigacion_descriptor (
    codigo INTEGER NOT NULL,
    descriptor VARCHAR(20) NOT NULL,
    PRIMARY KEY (codigo, descriptor),
    FOREIGN KEY (codigo) REFERENCES Linea_Investigacion(codigo) ON DELETE CASCADE
);

CREATE TABLE Proyecto_investigacion (
    cod_referencia INTEGER NOT NULL PRIMARY KEY
);

CREATE TABLE Publicacion (
    num_disc INTEGER NOT NULL,
    Produce_cod_referencia INTEGER NOT NULL,
    PRIMARY KEY (Produce_cod_referencia, num_disc),
    FOREIGN KEY (Produce_cod_referencia) REFERENCES Proyecto_investigacion(cod_referencia) ON DELETE CASCADE
);

CREATE TABLE Escribe (
    codigo INTEGER NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    cod_referencia INTEGER NOT NULL,
    num_disc INTEGER NOT NULL,
    PRIMARY KEY (nombre, cod_referencia, num_disc),
    FOREIGN KEY (codigo) REFERENCES Linea_Investigacion(codigo),
    FOREIGN KEY (nombre) REFERENCES Profesor(nombre),
    FOREIGN KEY (cod_referencia, num_disc) REFERENCES Publicacion(cod_referencia, num_disc)
);

CREATE TABLE Desarrolla (
    nombre VARCHAR(20) NOT NULL,
    codigo INTEGER NOT NULL,
    PRIMARY KEY (nombre, codigo),
    FOREIGN KEY (nombre) REFERENCES Profesor(nombre),
    FOREIGN KEY (codigo) REFERENCES Linea_Investigacion(codigo)
);

CREATE TABLE Incluye (
    codigo INTEGER NOT NULL,
    cod_referencia INTEGER NOT NULL,
    PRIMARY KEY (codigo, cod_referencia),
    FOREIGN KEY (codigo) REFERENCES Linea_Investigacion(codigo),
    FOREIGN KEY (cod_referencia) REFERENCES Proyecto_investigacion(cod_referencia)
);

