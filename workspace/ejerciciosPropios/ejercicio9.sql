-- Fecha: 30/5/2026, 18:23:04

CREATE TABLE paciente (
    DNI VARCHAR(9) NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    fecha_nac DATE NOT NULL,
    dir VARCHAR(20) NOT NULL,
    PRIMARY KEY (DNI)
);

CREATE TABLE medico_oftalmologico (
    DNI VARCHAR(9) NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    fecha_nac DATE NOT NULL,
    PRIMARY KEY (DNI)
);

CREATE TABLE clinica (
    calle VARCHAR(20) NOT NULL,
    numero INTEGER NOT NULL,
    cod_postal INTEGER NOT NULL,
    tlf VARCHAR(9) NOT NULL,
    ciudad VARCHAR(20) NOT NULL,
    PRIMARY KEY (calle, numero, cod_postal)
);

CREATE TABLE tratamiento (
    nombre VARCHAR(20) NOT NULL,
    fecha_i DATE NOT NULL,
    paciente_DNI VARCHAR(9) NOT NULL,
    medico_oftalmologico_DNI VARCHAR(9) NULL,
    PRIMARY KEY (nombre, fecha_i, paciente_DNI),
    FOREIGN KEY (paciente_DNI) REFERENCES paciente(DNI) ON DELETE CASCADE,
    FOREIGN KEY (medico_oftalmologico_DNI) REFERENCES medico_oftalmologico(DNI) ON DELETE SET NULL
);

CREATE TABLE prueba (
    cod_prueba INTEGER NOT NULL,
    tratamiento_nombre VARCHAR(20) NOT NULL,
    tratamiento_fecha_i DATE NOT NULL,
    paciente_DNI VARCHAR(9) NOT NULL,
    fecha DATE NOT NULL,
    descripcion VARCHAR(20) NOT NULL,
    hora TIME NOT NULL,
    medico_oftalmologico_DNI VARCHAR(9) NULL,
    PRIMARY KEY (cod_prueba, tratamiento_nombre, tratamiento_fecha_i, paciente_DNI),
    FOREIGN KEY (tratamiento_nombre, tratamiento_fecha_i, paciente_DNI) REFERENCES tratamiento(nombre, fecha_i, paciente_DNI) ON DELETE CASCADE,
    FOREIGN KEY (medico_oftalmologico_DNI) REFERENCES medico_oftalmologico(DNI) ON DELETE SET NULL
);

CREATE TABLE pertenece (
    clinica_calle VARCHAR(20) NOT NULL,
    clinica_numero INTEGER NOT NULL,
    clinica_cod_postal INTEGER NOT NULL,
    medico_oftalmologico_DNI VARCHAR(9) NOT NULL,
    PRIMARY KEY (clinica_calle, clinica_numero, clinica_cod_postal, medico_oftalmologico_DNI),
    FOREIGN KEY (clinica_calle, clinica_numero, clinica_cod_postal) REFERENCES clinica(calle, numero, cod_postal) ON DELETE CASCADE,
    FOREIGN KEY (medico_oftalmologico_DNI) REFERENCES medico_oftalmologico(DNI) ON DELETE CASCADE
);

CREATE TABLE pertenece_periodo (
    clinica_calle VARCHAR(20) NOT NULL,
    clinica_numero INTEGER NOT NULL,
    clinica_cod_postal INTEGER NOT NULL,
    medico_oftalmologico_DNI VARCHAR(9) NOT NULL,
    fecha_i DATE NOT NULL,
    fecha_f DATE NULL,
    PRIMARY KEY (clinica_calle, clinica_numero, clinica_cod_postal, medico_oftalmologico_DNI, fecha_i),
    FOREIGN KEY (clinica_calle, clinica_numero, clinica_cod_postal, medico_oftalmologico_DNI) REFERENCES pertenece(clinica_calle, clinica_numero, clinica_cod_postal, medico_oftalmologico_DNI) ON DELETE CASCADE
);

