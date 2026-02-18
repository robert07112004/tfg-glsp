-- Fecha: 18/2/2026, 15:28:24

CREATE TABLE Serie (
    serie_id INTEGER NOT NULL PRIMARY KEY,
    titulo VARCHAR(10) NOT NULL
);

CREATE TABLE NewEntityNode2 (
    num_episodio_disc INTEGER NOT NULL,
    serie_id INTEGER NOT NULL,
    tipo_NewEntityNode2 VARCHAR(100) DEFAULT 'NewEntityNode2' NOT NULL,
    NewAttribute4 INTEGER NOT NULL,
    PRIMARY KEY (num_episodio_disc, serie_id),
    CHECK (tipo_NewEntityNode2 = 'NewEntityNode2'),
    FOREIGN KEY (num_episodio_disc, serie_id, tipo_NewEntityNode2) REFERENCES Episodio(num_episodio_disc, serie_id, tipo_Episodio) ON DELETE CASCADE
);

CREATE TABLE NewEntityNode3 (
    num_episodio_disc INTEGER NOT NULL,
    serie_id INTEGER NOT NULL,
    tipo_NewEntityNode3 VARCHAR(100) DEFAULT 'NewEntityNode3' NOT NULL,
    PRIMARY KEY (num_episodio_disc, serie_id),
    CHECK (tipo_NewEntityNode3 = 'NewEntityNode3'),
    FOREIGN KEY (num_episodio_disc, serie_id, tipo_NewEntityNode3) REFERENCES Episodio(num_episodio_disc, serie_id, tipo_Episodio) ON DELETE CASCADE
);

CREATE TABLE Episodio (
    tipo_Episodio VARCHAR(100) ENUM('NewEntityNode2', 'NewEntityNode3', "Otro"),
    serie_id INTEGER NOT NULL,
    num_episodio_disc INTEGER NOT NULL,
    NewKeyAttribute2 INTEGER NOT NULL UNIQUE,
    duracion INTEGER NOT NULL,
    UNIQUE (serie_id, num_episodio_disc, tipo_Episodio),
    FOREIGN KEY (serie_id) REFERENCES Serie(serie_id) ON DELETE CASCADE
);

CREATE TABLE Tienen_NewMultiValuedAttribute1 (
    serie_id INTEGER NOT NULL,
    num_episodio_disc INTEGER NOT NULL,
    NewMultiValuedAttribute1 INTEGER NOT NULL,
    PRIMARY KEY (serie_id, num_episodio_disc, NewMultiValuedAttribute1),
    FOREIGN KEY (serie_id, num_episodio_disc) REFERENCES Episodio(serie_id, num_episodio_disc) ON DELETE CASCADE
);

