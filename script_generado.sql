-- Script generado por GLSP-ER
-- Fecha: 27/11/2025, 18:47:07

CREATE TABLE Empleado (
    id INTEGER PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL
);

CREATE TABLE Tarjeta_acceso (
    fecha_emision DATE NOT NULL,
    Empleado_id INTEGER NOT NULL,
    PRIMARY KEY (Empleado_id),
    FOREIGN KEY (Empleado_id) REFERENCES Empleado(id) ON DELETE CASCADE
);

