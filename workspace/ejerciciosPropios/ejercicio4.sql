-- Fecha: 27/5/2026, 19:43:33

CREATE TABLE linea_investigacion (
    codigo INTEGER NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    PRIMARY KEY (codigo)
);

CREATE TABLE linea_investigacion_descriptor (
    codigo INTEGER NOT NULL,
    descriptor VARCHAR(20) NOT NULL,
    PRIMARY KEY (codigo, descriptor),
    FOREIGN KEY (codigo) REFERENCES linea_investigacion(codigo) ON DELETE CASCADE
);

CREATE TABLE profesor (
    nombre VARCHAR(20) NOT NULL,
    despacho VARCHAR(20) NOT NULL,
    tlf VARCHAR(20) NOT NULL,
    tipo_profesor ENUM('doctor', 'no_doctor') NOT NULL,
    PRIMARY KEY (nombre),
    UNIQUE (nombre, tipo_profesor)
);

CREATE TABLE doctor (
    nombre VARCHAR(20) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'doctor' NOT NULL,
    PRIMARY KEY (nombre),
    CHECK (tipo = 'doctor'),
    FOREIGN KEY (nombre, tipo) REFERENCES profesor(nombre, tipo_profesor) ON DELETE CASCADE
);

CREATE TABLE no_doctor (
    nombre VARCHAR(20) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'no_doctor' NOT NULL,
    PRIMARY KEY (nombre),
    CHECK (tipo = 'no_doctor'),
    FOREIGN KEY (nombre, tipo) REFERENCES profesor(nombre, tipo_profesor) ON DELETE CASCADE
);

CREATE TABLE desarrolla (
    linea_investigacion_codigo INTEGER NOT NULL,
    profesor_nombre VARCHAR(20) NOT NULL,
    PRIMARY KEY (linea_investigacion_codigo, profesor_nombre),
    FOREIGN KEY (linea_investigacion_codigo) REFERENCES linea_investigacion(codigo) ON DELETE CASCADE,
    FOREIGN KEY (profesor_nombre) REFERENCES profesor(nombre) ON DELETE CASCADE
);

CREATE TABLE supervisa (
    doctor_nombre VARCHAR(20) NOT NULL,
    no_doctor_nombre VARCHAR(20) NOT NULL,
    PRIMARY KEY (doctor_nombre, no_doctor_nombre),
    FOREIGN KEY (doctor_nombre) REFERENCES doctor(nombre) ON DELETE CASCADE,
    FOREIGN KEY (no_doctor_nombre) REFERENCES no_doctor(nombre) ON DELETE CASCADE
);

CREATE TABLE supervisa_fecha (
    doctor_nombre VARCHAR(20) NOT NULL,
    no_doctor_nombre VARCHAR(20) NOT NULL,
    fecha_i DATE NOT NULL,
    fecha_f DATE NOT NULL,
    PRIMARY KEY (doctor_nombre, no_doctor_nombre, fecha_i, fecha_f),
    FOREIGN KEY (doctor_nombre, no_doctor_nombre) REFERENCES supervisa(doctor_nombre, no_doctor_nombre) ON DELETE CASCADE
);

CREATE TABLE proyecto_investigacion (
    cod_referencia INTEGER NOT NULL,
    presupuesto FLOAT NOT NULL,
    fecha_i DATE NOT NULL,
    fecha_f DATE NOT NULL,
    nombre VARCHAR(20) UNIQUE NOT NULL,
    doctor_nombre VARCHAR(20) NULL,
    PRIMARY KEY (cod_referencia),
    FOREIGN KEY (doctor_nombre) REFERENCES doctor(nombre) ON DELETE SET NULL
);

CREATE TABLE publicacion (
    num_publi INTEGER NOT NULL,
    proyecto_investigacion_cod_referencia INTEGER NOT NULL,
    titulo VARCHAR(20) NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    tipo_publicacion ENUM('revista', 'congreso', 'Otro') NULL,
    PRIMARY KEY (num_publi, proyecto_investigacion_cod_referencia),
    UNIQUE (num_publi, proyecto_investigacion_cod_referencia, tipo_publicacion),
    FOREIGN KEY (proyecto_investigacion_cod_referencia) REFERENCES proyecto_investigacion(cod_referencia) ON DELETE CASCADE
);

CREATE TABLE participa (
    profesor_nombre VARCHAR(20) NOT NULL,
    proyecto_investigacion_cod_referencia INTEGER NOT NULL,
    PRIMARY KEY (profesor_nombre, proyecto_investigacion_cod_referencia),
    FOREIGN KEY (profesor_nombre) REFERENCES profesor(nombre) ON DELETE CASCADE,
    FOREIGN KEY (proyecto_investigacion_cod_referencia) REFERENCES proyecto_investigacion(cod_referencia) ON DELETE CASCADE
);

CREATE TABLE participa_fecha (
    profesor_nombre VARCHAR(20) NOT NULL,
    proyecto_investigacion_cod_referencia INTEGER NOT NULL,
    fecha_i DATE NOT NULL,
    fecha_f DATE NOT NULL,
    PRIMARY KEY (profesor_nombre, proyecto_investigacion_cod_referencia, fecha_i, fecha_f),
    FOREIGN KEY (profesor_nombre, proyecto_investigacion_cod_referencia) REFERENCES participa(profesor_nombre, proyecto_investigacion_cod_referencia) ON DELETE CASCADE
);

CREATE TABLE escribe (
    linea_investigacion_codigo INTEGER NOT NULL,
    publicacion_num_publi INTEGER NOT NULL,
    publicacion_proyecto_investigacion_cod_referencia INTEGER NOT NULL,
    profesor_nombre VARCHAR(20) NOT NULL,
    PRIMARY KEY (publicacion_num_publi, publicacion_proyecto_investigacion_cod_referencia, profesor_nombre),
    FOREIGN KEY (linea_investigacion_codigo) REFERENCES linea_investigacion(codigo) ON DELETE CASCADE,
    FOREIGN KEY (publicacion_num_publi, publicacion_proyecto_investigacion_cod_referencia) REFERENCES publicacion(num_publi, proyecto_investigacion_cod_referencia) ON DELETE CASCADE,
    FOREIGN KEY (profesor_nombre) REFERENCES profesor(nombre) ON DELETE CASCADE
);

CREATE TABLE incluye (
    linea_investigacion_codigo INTEGER NOT NULL,
    proyecto_investigacion_cod_referencia INTEGER NOT NULL,
    PRIMARY KEY (linea_investigacion_codigo, proyecto_investigacion_cod_referencia),
    FOREIGN KEY (linea_investigacion_codigo) REFERENCES linea_investigacion(codigo) ON DELETE CASCADE,
    FOREIGN KEY (proyecto_investigacion_cod_referencia) REFERENCES proyecto_investigacion(cod_referencia) ON DELETE CASCADE
);

CREATE TABLE revista (
    num_publi INTEGER NOT NULL,
    proyecto_investigacion_cod_referencia INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'revista' NOT NULL,
    vol INTEGER NOT NULL,
    num INTEGER NOT NULL,
    p_ini INTEGER NOT NULL,
    p_fin INTEGER NOT NULL,
    PRIMARY KEY (num_publi, proyecto_investigacion_cod_referencia),
    CHECK (tipo = 'revista'),
    FOREIGN KEY (num_publi, proyecto_investigacion_cod_referencia, tipo) REFERENCES publicacion(num_publi, proyecto_investigacion_cod_referencia, tipo_publicacion) ON DELETE CASCADE
);

CREATE TABLE congreso (
    num_publi INTEGER NOT NULL,
    proyecto_investigacion_cod_referencia INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'congreso' NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    lugar VARCHAR(20) NOT NULL,
    fecha_i DATE NOT NULL,
    fecha_f DATE NOT NULL,
    editorial VARCHAR(20) NULL,
    PRIMARY KEY (num_publi, proyecto_investigacion_cod_referencia),
    CHECK (tipo = 'congreso'),
    FOREIGN KEY (num_publi, proyecto_investigacion_cod_referencia, tipo) REFERENCES publicacion(num_publi, proyecto_investigacion_cod_referencia, tipo_publicacion) ON DELETE CASCADE
);

