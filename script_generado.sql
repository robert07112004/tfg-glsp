-- Script generado por GLSP-ER
-- Fecha: 27/11/2025, 19:39:47

CREATE TABLE Vehiculo (
    matricula VARCHAR(10) PRIMARY KEY,
    marca VARCHAR(10) NOT NULL
);

CREATE TABLE Coche (
    matricula VARCHAR(10) PRIMARY KEY,
    numero_puertas INTEGER NOT NULL,
    FOREIGN KEY (matricula) REFERENCES Vehiculo(matricula) ON DELETE CASCADE
);

CREATE TABLE Moto (
    matricula VARCHAR(10) PRIMARY KEY,
    cilindrada INTEGER NOT NULL,
    FOREIGN KEY (matricula) REFERENCES Vehiculo(matricula) ON DELETE CASCADE
);

