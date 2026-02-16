-- Fecha: 16/2/2026, 15:46:48

CREATE TABLE Proyecto (
    proyecto_id INTEGER NOT NULL PRIMARY KEY
);

CREATE TABLE Especialista (
    especialista_id INTEGER NOT NULL PRIMARY KEY
);

CREATE TABLE Tiene (
    proyecto_id INTEGER NOT NULL,
    especialista_id INTEGER NOT NULL,
    PRIMARY KEY (proyecto_id, especialista_id),
    FOREIGN KEY (proyecto_id) REFERENCES Proyecto(proyecto_id) ON DELETE CASCADE,
    FOREIGN KEY (especialista_id) REFERENCES Especialista(especialista_id) ON DELETE CASCADE
);

CREATE TABLE Tiene_NewMultiValuedAttribute1 (
    proyecto_id INTEGER NOT NULL,
    especialista_id INTEGER NOT NULL,
    NewMultiValuedAttribute1 INTEGER NOT NULL,
    PRIMARY KEY (proyecto_id, especialista_id, NewMultiValuedAttribute1),
    FOREIGN KEY (proyecto_id) REFERENCES Proyecto(proyecto_id) ON DELETE CASCADE,
    FOREIGN KEY (especialista_id) REFERENCES Especialista(especialista_id) ON DELETE CASCADE
);

