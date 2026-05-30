-- Fecha: 26/5/2026, 20:03:28

CREATE TABLE administrador (
    num_colegiado INTEGER NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    DNI VARCHAR(9) UNIQUE NOT NULL,
    PRIMARY KEY (num_colegiado)
);

CREATE TABLE comunidad_de_vecinos (
    cod_comunidad INTEGER NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    calle VARCHAR(20) NOT NULL,
    administrador_num_colegiado INTEGER NULL,
    honorarios VARCHAR(20) NULL,
    PRIMARY KEY (cod_comunidad),
    FOREIGN KEY (administrador_num_colegiado) REFERENCES administrador(num_colegiado) ON DELETE SET NULL
);

CREATE TABLE compañia (
    cod_comp INTEGER NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    dir VARCHAR(20) NOT NULL,
    PRIMARY KEY (cod_comp)
);

CREATE TABLE banco (
    cod_banco INTEGER NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    PRIMARY KEY (cod_banco)
);

CREATE TABLE propiedad (
    portal INTEGER NOT NULL,
    planta INTEGER NOT NULL,
    letra CHAR(1) NOT NULL,
    comunidad_de_vecinos_cod_comunidad INTEGER NOT NULL,
    porcentaje FLOAT NOT NULL,
    n_cuenta VARCHAR(20) NOT NULL,
    nombre_prop VARCHAR(20) NOT NULL,
    tlf VARCHAR(9) NOT NULL,
    dir_prop VARCHAR(20) NOT NULL,
    tipo_propiedad ENUM('vivienda_particular', 'oficina', 'local_comercial') NOT NULL,
    presidente_cod_comunidad INTEGER NOT NULL,
    vocal_cod_comunidad INTEGER NOT NULL,
    PRIMARY KEY (portal, planta, letra, comunidad_de_vecinos_cod_comunidad),
    UNIQUE (portal, planta, letra, comunidad_de_vecinos_cod_comunidad, tipo_propiedad),
    UNIQUE (presidente_cod_comunidad),
    FOREIGN KEY (comunidad_de_vecinos_cod_comunidad) REFERENCES comunidad_de_vecinos(cod_comunidad) ON DELETE CASCADE,
    FOREIGN KEY (presidente_cod_comunidad) REFERENCES comunidad_de_vecinos(cod_comunidad) ON DELETE NO ACTION,
    FOREIGN KEY (vocal_cod_comunidad) REFERENCES comunidad_de_vecinos(cod_comunidad) ON DELETE NO ACTION
);

CREATE TABLE cuenta (
    sucursal INTEGER NOT NULL,
    dc INTEGER NOT NULL,
    numero INTEGER NOT NULL,
    banco_cod_banco INTEGER NOT NULL,
    comunidad_de_vecinos_cod_comunidad INTEGER NOT NULL,
    PRIMARY KEY (sucursal, dc, numero, banco_cod_banco),
    UNIQUE (comunidad_de_vecinos_cod_comunidad),
    FOREIGN KEY (banco_cod_banco) REFERENCES banco(cod_banco) ON DELETE CASCADE,
    FOREIGN KEY (comunidad_de_vecinos_cod_comunidad) REFERENCES comunidad_de_vecinos(cod_comunidad) ON DELETE NO ACTION
);

CREATE TABLE contrata (
    comunidad_de_vecinos_cod_comunidad INTEGER NOT NULL,
    compañia_cod_comp INTEGER NOT NULL,
    PRIMARY KEY (comunidad_de_vecinos_cod_comunidad, compañia_cod_comp),
    FOREIGN KEY (comunidad_de_vecinos_cod_comunidad) REFERENCES comunidad_de_vecinos(cod_comunidad) ON DELETE CASCADE,
    FOREIGN KEY (compañia_cod_comp) REFERENCES compañia(cod_comp) ON DELETE CASCADE
);

CREATE TABLE vivienda_particular (
    portal INTEGER NOT NULL,
    planta INTEGER NOT NULL,
    letra CHAR(1) NOT NULL,
    comunidad_de_vecinos_cod_comunidad INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'vivienda_particular' NOT NULL,
    num_habitaciones INTEGER NOT NULL,
    PRIMARY KEY (portal, planta, letra, comunidad_de_vecinos_cod_comunidad),
    CHECK (tipo = 'vivienda_particular'),
    FOREIGN KEY (portal, planta, letra, comunidad_de_vecinos_cod_comunidad, tipo) REFERENCES propiedad(portal, planta, letra, comunidad_de_vecinos_cod_comunidad, tipo_propiedad) ON DELETE CASCADE
);

CREATE TABLE oficina (
    portal INTEGER NOT NULL,
    planta INTEGER NOT NULL,
    letra CHAR(1) NOT NULL,
    comunidad_de_vecinos_cod_comunidad INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'oficina' NOT NULL,
    actividad VARCHAR(20) NOT NULL,
    PRIMARY KEY (portal, planta, letra, comunidad_de_vecinos_cod_comunidad),
    CHECK (tipo = 'oficina'),
    FOREIGN KEY (portal, planta, letra, comunidad_de_vecinos_cod_comunidad, tipo) REFERENCES propiedad(portal, planta, letra, comunidad_de_vecinos_cod_comunidad, tipo_propiedad) ON DELETE CASCADE
);

CREATE TABLE local_comercial (
    portal INTEGER NOT NULL,
    planta INTEGER NOT NULL,
    letra CHAR(1) NOT NULL,
    comunidad_de_vecinos_cod_comunidad INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'local_comercial' NOT NULL,
    horario VARCHAR(20) NOT NULL,
    PRIMARY KEY (portal, planta, letra, comunidad_de_vecinos_cod_comunidad),
    CHECK (tipo = 'local_comercial'),
    FOREIGN KEY (portal, planta, letra, comunidad_de_vecinos_cod_comunidad, tipo) REFERENCES propiedad(portal, planta, letra, comunidad_de_vecinos_cod_comunidad, tipo_propiedad) ON DELETE CASCADE
);

CREATE TABLE recibo_cutoa_comunidad (
    num_recibo INTEGER NOT NULL,
    fecha DATE NOT NULL,
    importe FLOAT NOT NULL,
    propiedad_portal INTEGER NOT NULL,
    propiedad_planta INTEGER NOT NULL,
    propiedad_letra CHAR(1) NOT NULL,
    propiedad_comunidad_de_vecinos_cod_comunidad INTEGER NOT NULL,
    PRIMARY KEY (num_recibo),
    FOREIGN KEY (propiedad_portal, propiedad_planta, propiedad_letra, propiedad_comunidad_de_vecinos_cod_comunidad) REFERENCES propiedad(portal, planta, letra, comunidad_de_vecinos_cod_comunidad) ON DELETE NO ACTION
);

CREATE TABLE recibo_compañia (
    num_recibo INTEGER NOT NULL,
    fecha DATE NOT NULL,
    importe FLOAT NOT NULL,
    compañia_cod_comp INTEGER NULL,
    cuenta_sucursal INTEGER NULL,
    cuenta_dc INTEGER NULL,
    cuenta_numero INTEGER NULL,
    cuenta_banco_cod_banco INTEGER NULL,
    PRIMARY KEY (num_recibo),
    FOREIGN KEY (compañia_cod_comp) REFERENCES compañia(cod_comp) ON DELETE SET NULL,
    FOREIGN KEY (cuenta_sucursal, cuenta_dc, cuenta_numero, cuenta_banco_cod_banco) REFERENCES cuenta(sucursal, dc, numero, banco_cod_banco) ON DELETE SET NULL
);

