-- Fecha: 24/5/2026, 22:33:26

CREATE TABLE plaza (
    cod_plaza INTEGER NOT NULL,
    PRIMARY KEY (cod_plaza)
);

CREATE TABLE apoderado (
    cod_apoderado INTEGER NOT NULL,
    PRIMARY KEY (cod_apoderado)
);

CREATE TABLE torero (
    cod_torero INTEGER NOT NULL,
    apoderado_cod_apoderado INTEGER NOT NULL,
    apadrina_cod_torero INTEGER NULL,
    PRIMARY KEY (cod_torero),
    FOREIGN KEY (apoderado_cod_apoderado) REFERENCES apoderado(cod_apoderado) ON DELETE NO ACTION,
    FOREIGN KEY (apadrina_cod_torero) REFERENCES torero(cod_torero) ON DELETE SET NULL
);

CREATE TABLE corrida (
    orden INTEGER NOT NULL,
    feria VARCHAR(20) NOT NULL,
    año INTEGER NOT NULL,
    plaza_cod_plaza INTEGER NULL,
    torero_cod_torero INTEGER NOT NULL,
    orejas INTEGER NOT NULL,
    salida INTEGER NOT NULL,
    rabo INTEGER NOT NULL,
    PRIMARY KEY (orden, feria, año),
    FOREIGN KEY (plaza_cod_plaza) REFERENCES plaza(cod_plaza) ON DELETE SET NULL,
    FOREIGN KEY (torero_cod_torero) REFERENCES torero(cod_torero) ON DELETE NO ACTION
);

CREATE TABLE ganaderia (
    codigo INTEGER NOT NULL,
    PRIMARY KEY (codigo)
);

CREATE TABLE toro (
    numero_disc INTEGER NOT NULL,
    año_nac_disc INTEGER NOT NULL,
    ganaderia_codigo INTEGER NOT NULL,
    corrida_orden INTEGER NOT NULL,
    corrida_feria VARCHAR(20) NOT NULL,
    corrida_año INTEGER NOT NULL,
    PRIMARY KEY (numero_disc, año_nac_disc, ganaderia_codigo),
    FOREIGN KEY (ganaderia_codigo) REFERENCES ganaderia(codigo) ON DELETE CASCADE,
    FOREIGN KEY (corrida_orden, corrida_feria, corrida_año) REFERENCES corrida(orden, feria, año) ON DELETE NO ACTION
);

