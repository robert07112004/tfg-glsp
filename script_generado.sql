-- Fecha: 9/4/2026, 17:19:57

CREATE TABLE Popietario (
    NIF VARCHAR(20) NOT NULL PRIMARY KEY,
    Nombre VARCHAR(20) NOT NULL,
    Apellidos VARCHAR(20) NOT NULL,
    Direccion VARCHAR(100) NOT NULL,
    Telefono INTEGER NOT NULL,
    Email VARCHAR(50) NULL
);

CREATE TABLE Agenda (
    Cod_agencia INTEGER NOT NULL PRIMARY KEY,
    CIF VARCHAR(20) NOT NULL UNIQUE,
    Direccion VARCHAR(100) NOT NULL
);

CREATE TABLE Inquilino (
    NIF VARCHAR(20) NOT NULL PRIMARY KEY,
    Nombre VARCHAR(20) NOT NULL,
    Apellidos VARCHAR(20) NOT NULL,
    Telefono INTEGER NOT NULL,
    Descripcion VARCHAR(500) NOT NULL,
    Fecha_nacimiento DATE NOT NULL
);

CREATE TABLE Vivienda (
    Cod_viviedna INTEGER NOT NULL PRIMARY KEY,
    Calle VARCHAR(20) NOT NULL,
    Piso VARCHAR(20) NOT NULL,
    Poblacion VARCHAR(50) NOT NULL,
    CP INTEGER NOT NULL,
    Descripcion VARCHAR(500) NOT NULL,
    Numero INTEGER NOT NULL,
    Tiene_NIF VARCHAR(20) NOT NULL,
    Oferta_Cod_agencia INTEGER NULL,
    FOREIGN KEY (Tiene_NIF) REFERENCES Popietario(NIF),
    FOREIGN KEY (Oferta_Cod_agencia) REFERENCES Agenda(Cod_agencia)
);

CREATE TABLE Alquiler (
    Cod_alquiler INTEGER NOT NULL PRIMARY KEY,
    Importe_mensual FLOAT NOT NULL,
    Fecha_firma DATE NOT NULL,
    Fianza FLOAT NOT NULL,
    Fecha_inicio DATE NOT NULL,
    Fecha_fin DATE NOT NULL,
    Participa_Cod_viviedna INTEGER NULL,
    Realizadopor_NIF VARCHAR(20) NULL,
    Renovacion_Cod_alquiler INTEGER NULL UNIQUE,
    FOREIGN KEY (Participa_Cod_viviedna) REFERENCES Vivienda(Cod_viviedna),
    FOREIGN KEY (Realizadopor_NIF) REFERENCES Inquilino(NIF),
    FOREIGN KEY (Renovacion_Cod_alquiler) REFERENCES Alquiler(Cod_alquiler)
);

