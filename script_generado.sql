-- Script generado por GLSP-ER (Consolidado)
-- Fecha: 26/1/2026, 21:06:39

CREATE TABLE Hombre (
    Cod_Hombre INTEGER NOT NULL,
    Cod_Mujer INTEGER UNIQUE NOT NULL,
    Num_Licencia INTEGER NOT NULL,
    Regimen VARCHAR(200) NOT NULL,
    PRIMARY KEY (Cod_Hombre, Num_Licencia),
    FOREIGN KEY (Cod_Mujer) REFERENCES Mujer(Cod_Mujer) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Mujer (
    Cod_Mujer INTEGER NOT NULL,
    Cod_Hombre INTEGER UNIQUE NOT NULL,
    Num_Licencia INTEGER NOT NULL,
    Regimen VARCHAR(200) NOT NULL,
    PRIMARY KEY (Cod_Mujer, Num_Licencia),
    FOREIGN KEY (Cod_Hombre) REFERENCES Hombre(Cod_Hombre) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Profesor (
    id_prof INTEGER NOT NULL,
    PRIMARY KEY (id_prof)
);

CREATE TABLE Despacho (
    id_despacho INTEGER NOT NULL,
    id_prof INTEGER UNIQUE NOT NULL,
    Fecha DATE NOT NULL,
    material VARCHAR(200) NOT NULL,
    PRIMARY KEY (id_despacho, Fecha),
    FOREIGN KEY (id_prof) REFERENCES Profesor(id_prof) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Expediente (
    cod_exped INTEGER NOT NULL,
    PRIMARY KEY (cod_exped)
);

CREATE TABLE Ciudadano (
    dni VARCHAR(10) NOT NULL,
    cod_exped INTEGER UNIQUE NOT NULL,
    Cod_Validacion VARCHAR(20) NOT NULL,
    Fecha DATE NOT NULL,
    PRIMARY KEY (dni, Cod_Validacion),
    FOREIGN KEY (cod_exped) REFERENCES Expediente(cod_exped) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Matrimonio (
    Cod_Mujer INTEGER NOT NULL,
    Cod_Hombre INTEGER UNIQUE NOT NULL,
    Num_Licencia INTEGER UNIQUE NOT NULL,
    Regimen VARCHAR(200) NOT NULL,
    PRIMARY KEY (Cod_Mujer),
    FOREIGN KEY (Cod_Mujer) REFERENCES Mujer(Cod_Mujer) ON DELETE CASCADE,
    FOREIGN KEY (Cod_Hombre) REFERENCES Hombre(Cod_Hombre) ON DELETE CASCADE
);

