-- Fecha: 14/2/2026, 13:52:09

CREATE TABLE Tarea (
    id_tarea INTEGER NOT NULL PRIMARY KEY,
    Flujo_id_tarea INTEGER NOT NULL ,
    FOREIGN KEY (Flujo_id_tarea) REFERENCES Tarea(id_tarea) ON DELETE CASCADE
);

CREATE TABLE Flujo_NewMultiValuedAttribute1 (
    id_tarea INTEGER NOT NULL,
    NewMultiValuedAttribute1 INTEGER NOT NULL,
    PRIMARY KEY (id_tarea, NewMultiValuedAttribute1),
    FOREIGN KEY (id_tarea) REFERENCES Tarea(id_tarea) ON DELETE CASCADE
);

