-- Fecha: 24/5/2026, 22:43:48

CREATE TABLE monitor (
    dni_m VARCHAR(9) NOT NULL,
    PRIMARY KEY (dni_m)
);

CREATE TABLE monitor_preparacion (
    dni_m VARCHAR(9) NOT NULL,
    preparacion VARCHAR(20) NOT NULL,
    PRIMARY KEY (dni_m, preparacion),
    FOREIGN KEY (dni_m) REFERENCES monitor(dni_m) ON DELETE CASCADE
);

CREATE TABLE socio (
    n_socio INTEGER NOT NULL,
    PRIMARY KEY (n_socio)
);

CREATE TABLE squash (
    n_pista INTEGER NOT NULL,
    ubicacion VARCHAR(20) NOT NULL,
    estado VARCHAR(20) NOT NULL,
    PRIMARY KEY (n_pista)
);

CREATE TABLE sala (
    n_sala INTEGER NOT NULL,
    metros FLOAT NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    ubiacion VARCHAR(20) NOT NULL,
    PRIMARY KEY (n_sala)
);

CREATE TABLE reserva (
    socio_n_socio INTEGER NOT NULL,
    squash_n_pista INTEGER NOT NULL,
    hora TIME NOT NULL,
    fecha DATE NOT NULL,
    PRIMARY KEY (socio_n_socio, squash_n_pista),
    FOREIGN KEY (socio_n_socio) REFERENCES socio(n_socio) ON DELETE CASCADE,
    FOREIGN KEY (squash_n_pista) REFERENCES squash(n_pista) ON DELETE CASCADE
);

CREATE TABLE aparato (
    codigo INTEGER NOT NULL,
    sala_n_sala INTEGER NULL,
    PRIMARY KEY (codigo),
    FOREIGN KEY (sala_n_sala) REFERENCES sala(n_sala) ON DELETE SET NULL
);

CREATE TABLE clase (
    cod_clas INTEGER NOT NULL,
    monitor_dni_m VARCHAR(9) NULL,
    sala_n_sala INTEGER NULL,
    PRIMARY KEY (cod_clas),
    FOREIGN KEY (monitor_dni_m) REFERENCES monitor(dni_m) ON DELETE SET NULL,
    FOREIGN KEY (sala_n_sala) REFERENCES sala(n_sala) ON DELETE SET NULL
);

CREATE TABLE asiste (
    clase_cod_clas INTEGER NOT NULL,
    socio_n_socio INTEGER NOT NULL,
    PRIMARY KEY (clase_cod_clas, socio_n_socio),
    FOREIGN KEY (clase_cod_clas) REFERENCES clase(cod_clas) ON DELETE CASCADE,
    FOREIGN KEY (socio_n_socio) REFERENCES socio(n_socio) ON DELETE CASCADE
);

