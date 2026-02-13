-- Fecha: 13/2/2026, 18:26:23

CREATE TABLE Pieza (
    Cod_Pieza INTEGER NOT NULL PRIMARY KEY
);

CREATE TABLE Composicion (
    Cod_Pieza_1 INTEGER NOT NULL,
    Cod_Pieza_2 INTEGER NOT NULL,
    Cantidad INTEGER NOT NULL,
    PRIMARY KEY (Cod_Pieza_1, Cod_Pieza_2),
    FOREIGN KEY (Cod_Pieza_1) REFERENCES Pieza(Cod_Pieza),
    FOREIGN KEY (Cod_Pieza_2) REFERENCES Pieza(Cod_Pieza)
);

CREATE TABLE Composicion_NewMultiValuedAttribute1 (
    Cod_Pieza_1 INTEGER NOT NULL,
    Cod_Pieza_2 INTEGER NOT NULL,
    NewMultiValuedAttribute1 INTEGER NOT NULL,
    PRIMARY KEY (Cod_Pieza_1, Cod_Pieza_2, NewMultiValuedAttribute1),
    FOREIGN KEY (Cod_Pieza_1) REFERENCES Pieza(Cod_Pieza) ON DELETE CASCADE,
    FOREIGN KEY (Cod_Pieza_2) REFERENCES Pieza(Cod_Pieza) ON DELETE CASCADE
);
