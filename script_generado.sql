-- Script generado por GLSP-ER
-- Fecha: 25/11/2025, 23:05:06

CREATE TABLE Estudiante (
    id INTEGER PRIMARY KEY
);

CREATE TABLE Asignatura (
    id INTEGER PRIMARY KEY
);

CREATE TABLE Matricula (
    Estudiante_id INTEGER,
    Asignatura_id INTEGER,
    fecha DATE,
    PRIMARY KEY (Estudiante_id, Asignatura_id),
    FOREIGN KEY (Estudiante_id) REFERENCES Estudiante(id),
    FOREIGN KEY (Asignatura_id) REFERENCES Asignatura(id)
);

