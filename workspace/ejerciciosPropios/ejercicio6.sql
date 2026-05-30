-- Fecha: 29/5/2026, 18:29:17

CREATE TABLE proyecto_de_investigacion (
    cod_proy INTEGER NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    dinero FLOAT NOT NULL,
    PRIMARY KEY (cod_proy)
);

CREATE TABLE departamento (
    nombre VARCHAR(20) NOT NULL,
    remanente VARCHAR(20) NOT NULL,
    PRIMARY KEY (nombre)
);

CREATE TABLE profesor (
    DNI VARCHAR(9) NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    PRIMARY KEY (DNI)
);

CREATE TABLE categoria (
    tipo VARCHAR(20) NOT NULL,
    dedicacion VARCHAR(20) NOT NULL,
    PRIMARY KEY (tipo)
);

CREATE TABLE pais (
    cod_pais INTEGER NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    PRIMARY KEY (cod_pais)
);

CREATE TABLE viaje (
    cod_viaje INTEGER NOT NULL,
    motivo VARCHAR(20) NOT NULL,
    ciudad_o VARCHAR(20) NOT NULL,
    ciudad_d VARCHAR(20) NOT NULL,
    fecha_i DATE NOT NULL,
    fecha_f DATE NOT NULL,
    proyecto_de_investigacion_cod_proy INTEGER NULL,
    departamento_nombre VARCHAR(20) NULL,
    pais_cod_pais INTEGER NULL,
    profesor_DNI VARCHAR(9) NOT NULL,
    PRIMARY KEY (cod_viaje),
    FOREIGN KEY (proyecto_de_investigacion_cod_proy) REFERENCES proyecto_de_investigacion(cod_proy) ON DELETE SET NULL,
    FOREIGN KEY (departamento_nombre) REFERENCES departamento(nombre) ON DELETE SET NULL,
    FOREIGN KEY (pais_cod_pais) REFERENCES pais(cod_pais) ON DELETE SET NULL,
    FOREIGN KEY (profesor_DNI) REFERENCES profesor(DNI) ON DELETE CASCADE
);

CREATE TABLE investigador_principal (
    profesor_DNI VARCHAR(9) NOT NULL,
    proyecto_de_investigacion_cod_proy INTEGER NOT NULL,
    PRIMARY KEY (profesor_DNI, proyecto_de_investigacion_cod_proy),
    FOREIGN KEY (profesor_DNI) REFERENCES profesor(DNI) ON DELETE CASCADE,
    FOREIGN KEY (proyecto_de_investigacion_cod_proy) REFERENCES proyecto_de_investigacion(cod_proy) ON DELETE CASCADE
);

CREATE TABLE investigador_principal_periodo (
    profesor_DNI VARCHAR(9) NOT NULL,
    proyecto_de_investigacion_cod_proy INTEGER NOT NULL,
    fecha_i DATE NOT NULL,
    fecha_f DATE NULL,
    PRIMARY KEY (profesor_DNI, proyecto_de_investigacion_cod_proy, fecha_i),
    FOREIGN KEY (profesor_DNI, proyecto_de_investigacion_cod_proy) REFERENCES investigador_principal(profesor_DNI, proyecto_de_investigacion_cod_proy) ON DELETE CASCADE
);

CREATE TABLE trabaja (
    proyecto_de_investigacion_cod_proy INTEGER NOT NULL,
    profesor_DNI VARCHAR(9) NOT NULL,
    PRIMARY KEY (proyecto_de_investigacion_cod_proy, profesor_DNI),
    FOREIGN KEY (proyecto_de_investigacion_cod_proy) REFERENCES proyecto_de_investigacion(cod_proy) ON DELETE CASCADE,
    FOREIGN KEY (profesor_DNI) REFERENCES profesor(DNI) ON DELETE CASCADE
);

CREATE TABLE trabaja_periodo (
    proyecto_de_investigacion_cod_proy INTEGER NOT NULL,
    profesor_DNI VARCHAR(9) NOT NULL,
    fecha_i DATE NOT NULL,
    fecha_f DATE NOT NULL,
    PRIMARY KEY (proyecto_de_investigacion_cod_proy, profesor_DNI, fecha_i, fecha_f),
    FOREIGN KEY (proyecto_de_investigacion_cod_proy, profesor_DNI) REFERENCES trabaja(proyecto_de_investigacion_cod_proy, profesor_DNI) ON DELETE CASCADE
);

CREATE TABLE adscrito (
    departamento_nombre VARCHAR(20) NOT NULL,
    profesor_DNI VARCHAR(9) NOT NULL,
    PRIMARY KEY (departamento_nombre, profesor_DNI),
    FOREIGN KEY (departamento_nombre) REFERENCES departamento(nombre) ON DELETE CASCADE,
    FOREIGN KEY (profesor_DNI) REFERENCES profesor(DNI) ON DELETE CASCADE
);

CREATE TABLE adscrito_periodo (
    departamento_nombre VARCHAR(20) NOT NULL,
    profesor_DNI VARCHAR(9) NOT NULL,
    fecha_f DATE NOT NULL,
    fecha_i DATE NOT NULL,
    PRIMARY KEY (departamento_nombre, profesor_DNI, fecha_f, fecha_i),
    FOREIGN KEY (departamento_nombre, profesor_DNI) REFERENCES adscrito(departamento_nombre, profesor_DNI) ON DELETE CASCADE
);

CREATE TABLE director (
    departamento_nombre VARCHAR(20) NOT NULL,
    profesor_DNI VARCHAR(9) NOT NULL,
    PRIMARY KEY (departamento_nombre, profesor_DNI),
    FOREIGN KEY (departamento_nombre) REFERENCES departamento(nombre) ON DELETE CASCADE,
    FOREIGN KEY (profesor_DNI) REFERENCES profesor(DNI) ON DELETE CASCADE
);

CREATE TABLE director_periodo (
    departamento_nombre VARCHAR(20) NOT NULL,
    profesor_DNI VARCHAR(9) NOT NULL,
    fecha_i DATE NOT NULL,
    fecha_f DATE NOT NULL,
    PRIMARY KEY (departamento_nombre, profesor_DNI, fecha_i, fecha_f),
    FOREIGN KEY (departamento_nombre, profesor_DNI) REFERENCES director(departamento_nombre, profesor_DNI) ON DELETE CASCADE
);

CREATE TABLE pertenece (
    profesor_DNI VARCHAR(9) NOT NULL,
    categoria_tipo VARCHAR(20) NOT NULL,
    PRIMARY KEY (profesor_DNI, categoria_tipo),
    FOREIGN KEY (profesor_DNI) REFERENCES profesor(DNI) ON DELETE CASCADE,
    FOREIGN KEY (categoria_tipo) REFERENCES categoria(tipo) ON DELETE CASCADE
);

CREATE TABLE pertenece_periodo (
    profesor_DNI VARCHAR(9) NOT NULL,
    categoria_tipo VARCHAR(20) NOT NULL,
    fecha_i DATE NOT NULL,
    fecha_f DATE NOT NULL,
    PRIMARY KEY (profesor_DNI, categoria_tipo, fecha_i, fecha_f),
    FOREIGN KEY (profesor_DNI, categoria_tipo) REFERENCES pertenece(profesor_DNI, categoria_tipo) ON DELETE CASCADE
);

CREATE TABLE dieta_diaria (
    categoria_tipo VARCHAR(20) NOT NULL,
    pais_cod_pais INTEGER NOT NULL,
    PRIMARY KEY (categoria_tipo, pais_cod_pais),
    FOREIGN KEY (categoria_tipo) REFERENCES categoria(tipo) ON DELETE CASCADE,
    FOREIGN KEY (pais_cod_pais) REFERENCES pais(cod_pais) ON DELETE CASCADE
);

CREATE TABLE dieta_diaria_periodo (
    categoria_tipo VARCHAR(20) NOT NULL,
    pais_cod_pais INTEGER NOT NULL,
    fecha_i DATE NOT NULL,
    fecha_i DATE NOT NULL,
    PRIMARY KEY (categoria_tipo, pais_cod_pais, fecha_i, fecha_i),
    FOREIGN KEY (categoria_tipo, pais_cod_pais) REFERENCES dieta_diaria(categoria_tipo, pais_cod_pais) ON DELETE CASCADE
);

CREATE TABLE gasto (
    num_gasto FLOAT NOT NULL,
    viaje_cod_viaje INTEGER NOT NULL,
    tipo_gasto ENUM('transporte', 'alojamiento', 'manutencion') NOT NULL,
    PRIMARY KEY (num_gasto, viaje_cod_viaje),
    UNIQUE (num_gasto, viaje_cod_viaje, tipo_gasto),
    FOREIGN KEY (viaje_cod_viaje) REFERENCES viaje(cod_viaje) ON DELETE CASCADE
);

CREATE TABLE transporte (
    num_gasto FLOAT NOT NULL,
    viaje_cod_viaje INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'transporte' NOT NULL,
    n_recibos INTEGER NOT NULL,
    importe FLOAT NOT NULL,
    PRIMARY KEY (num_gasto, viaje_cod_viaje),
    CHECK (tipo = 'transporte'),
    FOREIGN KEY (num_gasto, viaje_cod_viaje, tipo) REFERENCES gasto(num_gasto, viaje_cod_viaje, tipo_gasto) ON DELETE CASCADE
);

CREATE TABLE alojamiento (
    num_gasto FLOAT NOT NULL,
    viaje_cod_viaje INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'alojamiento' NOT NULL,
    n_noches INTEGER NOT NULL,
    importe FLOAT NOT NULL,
    PRIMARY KEY (num_gasto, viaje_cod_viaje),
    CHECK (tipo = 'alojamiento'),
    FOREIGN KEY (num_gasto, viaje_cod_viaje, tipo) REFERENCES gasto(num_gasto, viaje_cod_viaje, tipo_gasto) ON DELETE CASCADE
);

CREATE TABLE manutencion (
    num_gasto FLOAT NOT NULL,
    viaje_cod_viaje INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'manutencion' NOT NULL,
    n_dias INTEGER NOT NULL,
    importe FLOAT NOT NULL,
    PRIMARY KEY (num_gasto, viaje_cod_viaje),
    CHECK (tipo = 'manutencion'),
    FOREIGN KEY (num_gasto, viaje_cod_viaje, tipo) REFERENCES gasto(num_gasto, viaje_cod_viaje, tipo_gasto) ON DELETE CASCADE
);

