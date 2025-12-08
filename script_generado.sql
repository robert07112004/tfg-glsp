-- Script generado por GLSP-ER
-- Fecha: 8/12/2025, 20:28:00

CREATE TABLE Recibo (
    Num_recibo INTEGER PRIMARY KEY,
    Fecha DATE NOT NULL,
    Importe FLOAT NOT NULL
);

CREATE TABLE Recibo_Compañia (
    Num_recibo INTEGER NOT NULL,
    FOREIGN KEY (Num_recibo) REFERENCES Recibo(Num_recibo) ON DELETE CASCADE
);

CREATE TABLE Recibo_Cuota_Comunidad (
    Num_recibo INTEGER NOT NULL,
    Estado VARCHAR(20) NOT NULL,
    FOREIGN KEY (Num_recibo) REFERENCES Recibo(Num_recibo) ON DELETE CASCADE
);

CREATE TABLE Compañia (
    CIF VARCHAR(20) PRIMARY KEY,
    Persona_contacto VARCHAR(20) NOT NULL,
    Direccion VARCHAR(50) NOT NULL,
    Telefono INTEGER NOT NULL,
    Nombre VARCHAR(20) NOT NULL
);

CREATE TABLE Banco (
    Cod_banco INTEGER PRIMARY KEY,
    Nombre VARCHAR(20) NOT NULL,
    Persona_contacto VARCHAR(20) NOT NULL
);

CREATE TABLE Comunidad_De_Vecinos (
    Cod_comunidad INTEGER PRIMARY KEY,
    Nombre VARCHAR(20) NOT NULL,
    Calle VARCHAR(20) NOT NULL,
    Cod_postal INTEGER NOT NULL,
    Poblacion VARCHAR(20) NOT NULL
);

CREATE TABLE Cuenta (
    Sucursal INTEGER NOT NULL,
    DC INTEGER NOT NULL,
    Numero INTEGER NOT NULL,
    Saldo FLOAT NOT NULL,
    Cod_cuenta INTEGER NOT NULL,
    Banco_Cod_banco INTEGER NOT NULL,
    PRIMARY KEY (Cod_cuenta, Banco_Cod_banco),
    FOREIGN KEY (Banco_Cod_banco) REFERENCES Banco(Cod_banco) ON DELETE CASCADE
);

CREATE TABLE Propiedad (
    Letra VARCHAR(1) NOT NULL,
    Planta INTEGER NOT NULL,
    Portal INTEGER NOT NULL,
    Num_cuenta INTEGER NOT NULL,
    Porcentaje FLOAT NOT NULL,
    Telefono INTEGER NOT NULL,
    Nombre_inquilino VARCHAR(20) NOT NULL,
    Cod_propiedad INTEGER NOT NULL,
    Comunidad_De_Vecinos_Cod_comunidad INTEGER NOT NULL,
    PRIMARY KEY (Cod_propiedad, Comunidad_De_Vecinos_Cod_comunidad),
    FOREIGN KEY (Comunidad_De_Vecinos_Cod_comunidad) REFERENCES Comunidad_De_Vecinos(Cod_comunidad) ON DELETE CASCADE
);




