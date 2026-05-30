-- Fecha: 25/5/2026, 18:00:36

CREATE TABLE familia (
    codigo INTEGER NOT NULL,
    PRIMARY KEY (codigo)
);

CREATE TABLE laboratorio (
    codigo INTEGER NOT NULL,
    PRIMARY KEY (codigo)
);

CREATE TABLE medicamento (
    codigo INTEGER NOT NULL,
    familia_codigo INTEGER NOT NULL,
    laboratorio_codigo INTEGER NOT NULL,
    PRIMARY KEY (codigo),
    FOREIGN KEY (familia_codigo) REFERENCES familia(codigo) ON DELETE NO ACTION,
    FOREIGN KEY (laboratorio_codigo) REFERENCES laboratorio(codigo) ON DELETE NO ACTION
);

CREATE TABLE cliente (
    dni VARCHAR(9) NOT NULL,
    es_c_credito BOOLEAN DEFAULT FALSE NOT NULL,
    PRIMARY KEY (dni),
    UNIQUE (dni, es_c_credito)
);

CREATE TABLE c_credito (
    dni VARCHAR(9) NOT NULL,
    tipo BOOLEAN DEFAULT TRUE NOT NULL,
    datos_banco VARCHAR(20) NOT NULL,
    PRIMARY KEY (dni),
    CHECK (tipo = TRUE),
    FOREIGN KEY (dni, tipo) REFERENCES cliente(dni, es_c_credito) ON DELETE CASCADE
);

CREATE TABLE com_cred (
    medicamento_codigo INTEGER NOT NULL,
    c_credito_dni VARCHAR(9) NOT NULL,
    fecha_compra DATE NOT NULL,
    unidades INTEGER NOT NULL,
    fecha_pago DATE NOT NULL,
    PRIMARY KEY (medicamento_codigo, c_credito_dni),
    FOREIGN KEY (medicamento_codigo) REFERENCES medicamento(codigo) ON DELETE CASCADE,
    FOREIGN KEY (c_credito_dni) REFERENCES c_credito(dni) ON DELETE CASCADE
);

CREATE TABLE com_efec (
    medicamento_codigo INTEGER NOT NULL,
    cliente_dni VARCHAR(9) NOT NULL,
    fecha_compra DATE NOT NULL,
    unidades INTEGER NOT NULL,
    PRIMARY KEY (medicamento_codigo, cliente_dni),
    FOREIGN KEY (medicamento_codigo) REFERENCES medicamento(codigo) ON DELETE CASCADE,
    FOREIGN KEY (cliente_dni) REFERENCES cliente(dni) ON DELETE CASCADE
);

