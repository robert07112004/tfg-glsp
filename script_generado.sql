-- Script generado por GLSP-ER (Consolidado)
-- Fecha: 29/1/2026, 18:40:10

CREATE TABLE Profesor (
    Cod_Profesro INTEGER NOT NULL,
    Imp_Cod_Profesro INTEGER NOT NULL,
    Rec_Cod_Profesro INTEGER NOT NULL,
    PRIMARY KEY (Cod_Profesro),
    FOREIGN KEY (Imp_Cod_Profesro) REFERENCES Profesor(Cod_Profesro) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (Rec_Cod_Profesro) REFERENCES Profesor(Cod_Profesro) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT CHK_Overl_Imparte_Recibe CHECK (Cod_Curso IS NOT NULL OR Cod_Curso IS NOT NULL)
);

CREATE TABLE Curso (
    Cod_Curso INTEGER NOT NULL,
    PRIMARY KEY (Cod_Curso)
);

