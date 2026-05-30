-- Fecha: 30/5/2026, 19:07:01

CREATE TABLE especie (
    cod_especie INTEGER NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    PRIMARY KEY (cod_especie)
);

CREATE TABLE caladero (
    nombre VARCHAR(20) NOT NULL,
    ubicacion VARCHAR(20) NOT NULL,
    PRIMARY KEY (nombre)
);

CREATE TABLE barco (
    matricula INTEGER NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    clase VARCHAR(20) NOT NULL,
    CIF VARCHAR(9) UNIQUE NOT NULL,
    PRIMARY KEY (matricula)
);

CREATE TABLE factura (
    num_factura INTEGER NOT NULL,
    importe FLOAT NOT NULL,
    fecha_e DATE NOT NULL,
    tipo_factura ENUM('factura_comprador', 'factura_barco', 'Otro') NULL,
    PRIMARY KEY (num_factura),
    UNIQUE (num_factura, tipo_factura)
);

CREATE TABLE factura_barco (
    num_factura INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'factura_barco' NOT NULL,
    PRIMARY KEY (num_factura),
    CHECK (tipo = 'factura_barco'),
    FOREIGN KEY (num_factura, tipo) REFERENCES factura(num_factura, tipo_factura) ON DELETE CASCADE
);

CREATE TABLE comprador (
    cod_comprador INTEGER NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    dir VARCHAR(20) NOT NULL,
    CIF VARCHAR(20) UNIQUE NOT NULL,
    tipo_comprador ENUM('con_credito', 'sin_credito') NOT NULL,
    PRIMARY KEY (cod_comprador),
    UNIQUE (cod_comprador, tipo_comprador)
);

CREATE TABLE con_credito (
    cod_comprador INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'con_credito' NOT NULL,
    num_cuenta VARCHAR(20) NOT NULL,
    importe FLOAT NOT NULL,
    fecha DATE NOT NULL,
    PRIMARY KEY (cod_comprador),
    CHECK (tipo = 'con_credito'),
    FOREIGN KEY (cod_comprador, tipo) REFERENCES comprador(cod_comprador, tipo_comprador) ON DELETE CASCADE
);

CREATE TABLE sin_credito (
    cod_comprador INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'sin_credito' NOT NULL,
    PRIMARY KEY (cod_comprador),
    CHECK (tipo = 'sin_credito'),
    FOREIGN KEY (cod_comprador, tipo) REFERENCES comprador(cod_comprador, tipo_comprador) ON DELETE CASCADE
);

CREATE TABLE captura (
    especie_cod_especie INTEGER NOT NULL,
    caladero_nombre VARCHAR(20) NOT NULL,
    barco_matricula INTEGER NOT NULL,
    PRIMARY KEY (especie_cod_especie, caladero_nombre, barco_matricula),
    FOREIGN KEY (especie_cod_especie) REFERENCES especie(cod_especie) ON DELETE CASCADE,
    FOREIGN KEY (caladero_nombre) REFERENCES caladero(nombre) ON DELETE CASCADE,
    FOREIGN KEY (barco_matricula) REFERENCES barco(matricula) ON DELETE CASCADE
);

CREATE TABLE captura_kilos (
    especie_cod_especie INTEGER NOT NULL,
    caladero_nombre VARCHAR(20) NOT NULL,
    barco_matricula INTEGER NOT NULL,
    kilos FLOAT NOT NULL,
    PRIMARY KEY (especie_cod_especie, caladero_nombre, barco_matricula, kilos),
    FOREIGN KEY (especie_cod_especie, caladero_nombre, barco_matricula) REFERENCES captura(especie_cod_especie, caladero_nombre, barco_matricula) ON DELETE CASCADE
);

CREATE TABLE captura_periodo (
    especie_cod_especie INTEGER NOT NULL,
    caladero_nombre VARCHAR(20) NOT NULL,
    barco_matricula INTEGER NOT NULL,
    fecha_i DATE NOT NULL,
    fecha_f DATE NOT NULL,
    PRIMARY KEY (especie_cod_especie, caladero_nombre, barco_matricula, fecha_i, fecha_f),
    FOREIGN KEY (especie_cod_especie, caladero_nombre, barco_matricula) REFERENCES captura(especie_cod_especie, caladero_nombre, barco_matricula) ON DELETE CASCADE
);

CREATE TABLE factura_comprador (
    num_factura INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'factura_comprador' NOT NULL,
    fecha_pago DATE NULL,
    sin_credito_cod_comprador INTEGER NULL,
    estado VARCHAR(20) NULL,
    con_credito_cod_comprador INTEGER NULL,
    PRIMARY KEY (num_factura),
    CHECK (tipo = 'factura_comprador'),
    FOREIGN KEY (num_factura, tipo) REFERENCES factura(num_factura, tipo_factura) ON DELETE CASCADE,
    FOREIGN KEY (sin_credito_cod_comprador) REFERENCES sin_credito(cod_comprador) ON DELETE SET NULL,
    FOREIGN KEY (con_credito_cod_comprador) REFERENCES con_credito(cod_comprador) ON DELETE SET NULL
);

CREATE TABLE lote (
    cod_lote INTEGER NOT NULL,
    num_cajas INTEGER NOT NULL,
    fecha DATE NOT NULL,
    kilos FLOAT NOT NULL,
    especie_cod_especie INTEGER NOT NULL,
    barco_matricula INTEGER NULL,
    factura_barco_num_factura INTEGER NOT NULL,
    factura_comprador_num_factura INTEGER NOT NULL,
    comprador_cod_comprador INTEGER NULL,
    precio_kilo_final FLOAT NULL,
    PRIMARY KEY (cod_lote),
    FOREIGN KEY (especie_cod_especie) REFERENCES especie(cod_especie) ON DELETE NO ACTION,
    FOREIGN KEY (barco_matricula) REFERENCES barco(matricula) ON DELETE SET NULL,
    FOREIGN KEY (factura_barco_num_factura) REFERENCES factura_barco(num_factura) ON DELETE NO ACTION,
    FOREIGN KEY (factura_comprador_num_factura) REFERENCES factura_comprador(num_factura) ON DELETE NO ACTION,
    FOREIGN KEY (comprador_cod_comprador) REFERENCES comprador(cod_comprador) ON DELETE SET NULL
);

