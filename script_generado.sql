-- Fecha: 17/2/2026, 17:53:05

CREATE TABLE Proyecto (
    proyecto_id INTEGER NOT NULL PRIMARY KEY
);

CREATE TABLE NewEntityNode2 (
    especialista_id INTEGER NOT NULL PRIMARY KEY,
    tipo_NewEntityNode2 VARCHAR(100) DEFAULT 'NewEntityNode2' NOT NULL,
    CHECK (tipo_NewEntityNode2 = 'NewEntityNode2'),
    FOREIGN KEY (especialista_id, tipo_NewEntityNode2) REFERENCES Especialista(especialista_id, tipo_Especialista) ON DELETE CASCADE
);

CREATE TABLE NewEntityNode3 (
    especialista_id INTEGER NOT NULL PRIMARY KEY,
    tipo_NewEntityNode3 VARCHAR(100) DEFAULT 'NewEntityNode3' NOT NULL,
    CHECK (tipo_NewEntityNode3 = 'NewEntityNode3'),
    FOREIGN KEY (especialista_id, tipo_NewEntityNode3) REFERENCES Especialista(especialista_id, tipo_Especialista) ON DELETE CASCADE
);

CREATE TABLE Especialista (
    especialista_id INTEGER NOT NULL PRIMARY KEY,
    tipo_Especialista VARCHAR(100) ENUM('NewEntityNode2', 'NewEntityNode3', "Otro"),
    UNIQUE (especialista_id, tipo_Especialista)
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

