-- Script generado por GLSP-ER
-- Fecha: 29/11/2025, 21:23:21

CREATE TABLE Edificio (
    id INTEGER PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL
);

CREATE TABLE Laboratorio (
    Edificio_id INTEGER NOT NULL,
    equipamiento VARCHAR(100) NOT NULL,
    PRIMARY KEY (Edificio_id),
    FOREIGN KEY (Edificio_id) REFERENCES Sala(Edificio_id) ON DELETE CASCADE
);

CREATE TABLE Sala (
    numero INTEGER NOT NULL,
    capacidad INTEGER NOT NULL,
    Edificio_id INTEGER NOT NULL,
    PRIMARY KEY (Edificio_id),
    FOREIGN KEY (Edificio_id) REFERENCES Edificio(id) ON DELETE CASCADE
);

