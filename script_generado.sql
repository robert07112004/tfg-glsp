-- Fecha: 14/2/2026, 0:18:15

CREATE TABLE Empleado (
    Cod_Empleado INTEGER NOT NULL PRIMARY KEY,
    Supervisa_Cod_Empleado INTEGER NOT NULL ,
    Fecha DATE NOT NULL UNIQUE,
    NewAlternativeKeyAttribute3 INTEGER NOT NULL UNIQUE,
    NewAlternativeKeyAttribute3 INTEGER NOT NULL UNIQUE,
    FOREIGN KEY (Supervisa_Cod_Empleado) REFERENCES Empleado(Cod_Empleado) ON DELETE CASCADE
);

CREATE TABLE Supervisa_NewMultiValuedAttribute1 (
    Cod_Empleado INTEGER NOT NULL,
    NewMultiValuedAttribute1 INTEGER NOT NULL,
    PRIMARY KEY (Cod_Empleado, NewMultiValuedAttribute1),
    FOREIGN KEY (Cod_Empleado) REFERENCES Empleado(Cod_Empleado) ON DELETE CASCADE
);

