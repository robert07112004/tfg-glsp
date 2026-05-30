-- Fecha: 25/5/2026, 19:49:20

CREATE TABLE empleado (
    n_ss VARCHAR(20) NOT NULL,
    tipo_empleado ENUM('director', 'no_director') NOT NULL,
    PRIMARY KEY (n_ss),
    UNIQUE (n_ss, tipo_empleado)
);

CREATE TABLE departamento (
    nombre VARCHAR(20) NOT NULL,
    PRIMARY KEY (nombre)
);

CREATE TABLE hijo (
    dni VARCHAR(9) NOT NULL,
    empleado_n_ss VARCHAR(20) NOT NULL,
    PRIMARY KEY (dni),
    FOREIGN KEY (empleado_n_ss) REFERENCES empleado(n_ss) ON DELETE CASCADE
);

CREATE TABLE conc_beca (
    departamento_nombre VARCHAR(20) NOT NULL,
    hijo_dni VARCHAR(9) NOT NULL,
    fecha DATE NOT NULL,
    cuantia FLOAT NOT NULL,
    PRIMARY KEY (departamento_nombre, hijo_dni),
    FOREIGN KEY (departamento_nombre) REFERENCES departamento(nombre) ON DELETE CASCADE,
    FOREIGN KEY (hijo_dni) REFERENCES hijo(dni) ON DELETE CASCADE
);

CREATE TABLE director (
    n_ss VARCHAR(20) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'director' NOT NULL,
    departamento_nombre VARCHAR(20) NOT NULL,
    PRIMARY KEY (n_ss),
    CHECK (tipo = 'director'),
    UNIQUE (departamento_nombre),
    FOREIGN KEY (n_ss, tipo) REFERENCES empleado(n_ss, tipo_empleado) ON DELETE CASCADE,
    FOREIGN KEY (departamento_nombre) REFERENCES departamento(nombre) ON DELETE NO ACTION
);

CREATE TABLE no_director (
    n_ss VARCHAR(20) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'no_director' NOT NULL,
    departamento_nombre VARCHAR(20) NULL,
    PRIMARY KEY (n_ss),
    CHECK (tipo = 'no_director'),
    FOREIGN KEY (n_ss, tipo) REFERENCES empleado(n_ss, tipo_empleado) ON DELETE CASCADE,
    FOREIGN KEY (departamento_nombre) REFERENCES departamento(nombre) ON DELETE SET NULL
);

CREATE TABLE r_ventas (
    n_ss VARCHAR(20) NOT NULL,
    tipo BOOLEAN DEFAULT TRUE NOT NULL,
    PRIMARY KEY (n_ss),
    CHECK (tipo = TRUE),
    FOREIGN KEY (n_ss, tipo) REFERENCES no_director(n_ss, es_r_ventas) ON DELETE CASCADE
);

CREATE TABLE ingeniero (
    n_ss VARCHAR(20) NOT NULL,
    tipo BOOLEAN DEFAULT TRUE NOT NULL,
    especialidad VARCHAR(20) NOT NULL,
    PRIMARY KEY (n_ss),
    CHECK (tipo = TRUE),
    FOREIGN KEY (n_ss, tipo) REFERENCES no_director(n_ss, es_ingeniero) ON DELETE CASCADE
);

CREATE TABLE proyecto (
    nombre VARCHAR(20) NOT NULL,
    departamento_nombre VARCHAR(20) NULL,
    PRIMARY KEY (nombre),
    FOREIGN KEY (departamento_nombre) REFERENCES departamento(nombre) ON DELETE SET NULL
);

CREATE TABLE se_asigna (
    ingeniero_n_ss VARCHAR(20) NOT NULL,
    proyecto_nombre VARCHAR(20) NOT NULL,
    PRIMARY KEY (ingeniero_n_ss, proyecto_nombre),
    FOREIGN KEY (ingeniero_n_ss) REFERENCES ingeniero(n_ss) ON DELETE CASCADE,
    FOREIGN KEY (proyecto_nombre) REFERENCES proyecto(nombre) ON DELETE CASCADE
);

