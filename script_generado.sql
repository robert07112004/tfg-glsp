-- Script generado por GLSP-ER
-- Fecha: 26/11/2025, 23:34:35

CREATE TABLE Pieza (
    id INTEGER PRIMARY KEY
);

CREATE TABLE Es_parte_De (
    Pieza_id INTEGER,
    Es_parte_De_id INTEGER,
    PRIMARY KEY (Pieza_id, Es_parte_De_id),
    FOREIGN KEY (Pieza_id) REFERENCES Pieza(id),
    FOREIGN KEY (Es_parte_De_id) REFERENCES Pieza(id)
);

