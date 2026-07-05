-- Fecha: 27/6/2026, 17:38:22

CREATE TABLE titular (
    dni VARCHAR(9) NOT NULL,
    PRIMARY KEY (dni)
);

CREATE TABLE cliente (
    dni VARCHAR(9) NOT NULL,
    tlf VARCHAR(9) NOT NULL,
    dir VARCHAR(20) NOT NULL,
    PRIMARY KEY (dni)
);

CREATE TABLE agencia (
    codigo INT NOT NULL,
    fax VARCHAR(20) NOT NULL,
    dir VARCHAR(20) NOT NULL,
    tlf VARCHAR(9) NOT NULL,
    zona VARCHAR(20) NOT NULL,
    titular_dni VARCHAR(9) NOT NULL,
    PRIMARY KEY (codigo),
    UNIQUE (titular_dni),
    FOREIGN KEY (titular_dni) REFERENCES titular(dni) ON DELETE NO ACTION
);

CREATE TABLE vendedor (
    dni VARCHAR(9) NOT NULL,
    agencia_codigo INT NULL,
    PRIMARY KEY (dni),
    FOREIGN KEY (agencia_codigo) REFERENCES agencia(codigo) ON DELETE SET NULL
);

CREATE TABLE inmueble (
    codigo INT NOT NULL,
    superficie FLOAT NOT NULL,
    dir VARCHAR(20) NOT NULL,
    propietario VARCHAR(20) NOT NULL,
    tipo_inmueble ENUM('local_comercial', 'piso', 'Otro') NULL,
    tipo_inmueble_2 ENUM('venta', 'alquiler') NOT NULL,
    agencia_codigo INT NULL,
    PRIMARY KEY (codigo),
    UNIQUE (codigo, tipo_inmueble),
    UNIQUE (codigo, tipo_inmueble_2),
    FOREIGN KEY (agencia_codigo) REFERENCES agencia(codigo) ON DELETE SET NULL
);

CREATE TABLE local_comercial (
    codigo INT NOT NULL,
    tipo ENUM('local_comercial', 'piso', 'Otro') DEFAULT 'local_comercial' NOT NULL,
    licencia VARCHAR(20) NOT NULL,
    PRIMARY KEY (codigo),
    CHECK (tipo = 'local_comercial'),
    FOREIGN KEY (codigo, tipo) REFERENCES inmueble(codigo, tipo_inmueble) ON DELETE CASCADE
);

CREATE TABLE piso (
    codigo INT NOT NULL,
    tipo ENUM('local_comercial', 'piso', 'Otro') DEFAULT 'piso' NOT NULL,
    n_hab INT NOT NULL,
    gas VARCHAR(20) NOT NULL,
    n_banios INT NOT NULL,
    int_ext INT NOT NULL,
    PRIMARY KEY (codigo),
    CHECK (tipo = 'piso'),
    FOREIGN KEY (codigo, tipo) REFERENCES inmueble(codigo, tipo_inmueble) ON DELETE CASCADE
);

CREATE TABLE venta (
    codigo INT NOT NULL,
    tipo ENUM('venta', 'alquiler') DEFAULT 'venta' NOT NULL,
    hipoteca VARCHAR(20) NOT NULL,
    precio_v FLOAT NOT NULL,
    PRIMARY KEY (codigo),
    CHECK (tipo = 'venta'),
    FOREIGN KEY (codigo, tipo) REFERENCES inmueble(codigo, tipo_inmueble_2) ON DELETE CASCADE
);

CREATE TABLE alquiler (
    codigo INT NOT NULL,
    tipo ENUM('venta', 'alquiler') DEFAULT 'alquiler' NOT NULL,
    precio_a FLOAT NOT NULL,
    fianza FLOAT NOT NULL,
    PRIMARY KEY (codigo),
    CHECK (tipo = 'alquiler'),
    FOREIGN KEY (codigo, tipo) REFERENCES inmueble(codigo, tipo_inmueble_2) ON DELETE CASCADE
);

CREATE TABLE asigna (
    vendedor_dni VARCHAR(9) NOT NULL,
    cliente_dni VARCHAR(9) NOT NULL,
    PRIMARY KEY (vendedor_dni, cliente_dni),
    FOREIGN KEY (vendedor_dni) REFERENCES vendedor(dni) ON DELETE CASCADE,
    FOREIGN KEY (cliente_dni) REFERENCES cliente(dni) ON DELETE CASCADE
);

CREATE TABLE reserva (
    inmueble_codigo INT NOT NULL,
    cliente_dni VARCHAR(9) NOT NULL,
    senial FLOAT NOT NULL,
    PRIMARY KEY (inmueble_codigo, cliente_dni),
    FOREIGN KEY (inmueble_codigo) REFERENCES inmueble(codigo) ON DELETE CASCADE,
    FOREIGN KEY (cliente_dni) REFERENCES cliente(dni) ON DELETE CASCADE
);

