-- Fecha: 24/5/2026, 23:25:15

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

CREATE TABLE sala (
    n_sala INTEGER NOT NULL,
    metros FLOAT NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    ubiacion VARCHAR(20) NOT NULL,
    tipo_sala ENUM('s_clase', 's_aparato', 's_squash') NOT NULL,
    PRIMARY KEY (n_sala),
    UNIQUE (n_sala, tipo_sala)
);

CREATE TABLE s_clase (
    n_sala INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 's_clase' NOT NULL,
    PRIMARY KEY (n_sala),
    CHECK (tipo = 's_clase'),
    FOREIGN KEY (n_sala, tipo) REFERENCES sala(n_sala, tipo_sala) ON DELETE CASCADE
);

CREATE TABLE s_aparato (
    n_sala INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 's_aparato' NOT NULL,
    tipo_ap INTEGER NOT NULL,
    PRIMARY KEY (n_sala),
    CHECK (tipo = 's_aparato'),
    FOREIGN KEY (n_sala, tipo) REFERENCES sala(n_sala, tipo_sala) ON DELETE CASCADE
);

CREATE TABLE clase (
    cod_clas INTEGER NOT NULL,
    monitor_dni_m VARCHAR(9) NULL,
    s_clase_n_sala INTEGER NULL,
    PRIMARY KEY (cod_clas),
    FOREIGN KEY (monitor_dni_m) REFERENCES monitor(dni_m) ON DELETE SET NULL,
    FOREIGN KEY (s_clase_n_sala) REFERENCES s_clase(n_sala) ON DELETE SET NULL
);

CREATE TABLE s_squash (
    n_sala INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 's_squash' NOT NULL,
    estado VARCHAR(20) NOT NULL,
    PRIMARY KEY (n_sala),
    CHECK (tipo = 's_squash'),
    FOREIGN KEY (n_sala, tipo) REFERENCES sala(n_sala, tipo_sala) ON DELETE CASCADE
);

CREATE TABLE aparato (
    codigo INTEGER NOT NULL,
    s_aparato_n_sala INTEGER NOT NULL,
    PRIMARY KEY (codigo),
    FOREIGN KEY (s_aparato_n_sala) REFERENCES s_aparato(n_sala) ON DELETE NO ACTION
);

CREATE TABLE asiste (
    clase_cod_clas INTEGER NOT NULL,
    socio_n_socio INTEGER NOT NULL,
    PRIMARY KEY (clase_cod_clas, socio_n_socio),
    FOREIGN KEY (clase_cod_clas) REFERENCES clase(cod_clas) ON DELETE CASCADE,
    FOREIGN KEY (socio_n_socio) REFERENCES socio(n_socio) ON DELETE CASCADE
);

CREATE TABLE reserva (
    socio_n_socio INTEGER NOT NULL,
    s_squash_n_sala INTEGER NOT NULL,
    hora TIME NOT NULL,
    fecha DATE NOT NULL,
    PRIMARY KEY (socio_n_socio, s_squash_n_sala),
    FOREIGN KEY (socio_n_socio) REFERENCES socio(n_socio) ON DELETE CASCADE,
    FOREIGN KEY (s_squash_n_sala) REFERENCES s_squash(n_sala) ON DELETE CASCADE
);

