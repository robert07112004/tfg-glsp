-- Fecha: 9/2/2026, 18:16:13

CREATE TABLE Coche (
    marca INTEGER NOT NULL PRIMARY KEY,
    Plaza_num_Plaza INTEGER NULL  UNIQUE,
    FOREIGN KEY (Plaza_num_Plaza) REFERENCES Plaza(num_Plaza)
);

CREATE TABLE Coche_NewMultiValuedAttribute1 (
    Coche_marca INTEGER NOT NULL,
    NewMultiValuedAttribute1 INTEGER NOT NULL,
    PRIMARY KEY (Coche_marca, NewMultiValuedAttribute1),
    FOREIGN KEY (Coche_marca) REFERENCES Coche(marca) ON DELETE CASCADE
);

CREATE TABLE Plaza (
    num_Plaza INTEGER NOT NULL PRIMARY KEY
);

