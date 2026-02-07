-- Fecha: 7/2/2026, 23:09:15

CREATE TABLE Persona (
    Cod_persona INTEGER NOT NULL,
    Cod INTEGER NOT NULL,
    Codigo VARCHAR(100) NOT NULL,
    PRIMARY KEY (Cod_persona, Cod, Codigo)
);

CREATE TABLE Coche (
    dni INTEGER NOT NULL UNIQUE,
    numero INTEGER NOT NULL,
    nombre VARCHAR(100) NULL,
    cod INTEGER NULL,
    hola INTEGER NULL,
    pasaporte INTEGER NULL UNIQUE,
    UNIQUE (numero, nombre),
    UNIQUE (cod, hola)
);

CREATE TABLE Perro (
    correo INTEGER NOT NULL,
    hola INTEGER NOT NULL,
    calle VARCHAR(199) NOT NULL,
    numero INTEGER NULL
);

CREATE TABLE Pelota (
    NewAttribute6 INTEGER NULL,
    NewAttribute8 INTEGER NULL,
    NewAttribute9 INTEGER NULL
);

CREATE TABLE NewEntityNode5 (
    NewKeyAttribute4 INTEGER NOT NULL,
    NewKeyAttribute5 INTEGER NOT NULL,
    PRIMARY KEY (NewKeyAttribute4, NewKeyAttribute5)
);

CREATE TABLE NewEntityNode5_telefono (
    NewKeyAttribute4 INTEGER NOT NULL,
    NewKeyAttribute5 INTEGER NOT NULL,
    telefono INTEGER NOT NULL,
    PRIMARY KEY (NewKeyAttribute4, NewKeyAttribute5, telefono),
    FOREIGN KEY (NewKeyAttribute4, NewKeyAttribute5) REFERENCES NewEntityNode5(NewKeyAttribute4, NewKeyAttribute5)
);

CREATE TABLE NewEntityNode5_idiomas (
    NewKeyAttribute4 INTEGER NOT NULL,
    NewKeyAttribute5 INTEGER NOT NULL,
    NewAttribute11 INTEGER NOT NULL,
    NewAttribute10 INTEGER NULL,
    PRIMARY KEY (NewKeyAttribute4, NewKeyAttribute5, NewAttribute11, NewAttribute10),
    FOREIGN KEY (NewKeyAttribute4, NewKeyAttribute5) REFERENCES NewEntityNode5(NewKeyAttribute4, NewKeyAttribute5)
);

