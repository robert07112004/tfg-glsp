-- Fecha: 25/2/2026, 19:00:29

CREATE TABLE Profesor (
    id_profesor INTEGER NOT NULL PRIMARY KEY
);

CREATE TABLE Software (
    cod_software INTEGER NOT NULL PRIMARY KEY,
    Hola_id_profesor INTEGER NOT NULL UNIQUE,
    FOREIGN KEY (Hola_id_profesor) REFERENCES Profesor(id_profesor)
);

CREATE TABLE Ordenador (
    num_aula_disc INTEGER NOT NULL
);

CREATE TABLE Hola (
    cod_software INTEGER NOT NULL,
    id_profesor INTEGER NOT NULL,
    id_aula INTEGER NOT NULL,
    num_aula_disc INTEGER NOT NULL,
    PRIMARY KEY (cod_software, id_profesor),
    FOREIGN KEY (cod_software) REFERENCES Software(cod_software),
    FOREIGN KEY (id_profesor) REFERENCES Profesor(id_profesor),
    FOREIGN KEY (id_aula, num_aula_disc) REFERENCES Ordenador(id_aula, num_aula_disc)
);

CREATE TABLE Aula (
    id_aula INTEGER NOT NULL PRIMARY KEY,
    Pertenece_id_aula INTEGER NOT NULL,
    Pertenece_num_aula_disc INTEGER NOT NULL,
    PRIMARY KEY (Pertenece_id_aula, Pertenece_num_aula_disc),
    FOREIGN KEY (Pertenece_id_aula) REFERENCES Ordenador(id_aula) ON DELETE CASCADE,
    FOREIGN KEY (Pertenece_num_aula_disc) REFERENCES Ordenador(num_aula_disc) ON DELETE CASCADE
);

