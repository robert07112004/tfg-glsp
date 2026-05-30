-- Fecha: 27/5/2026, 0:11:33

CREATE TABLE paciente (
    num_paciente INTEGER NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    dir VARCHAR(20) NOT NULL,
    tlf VARCHAR(9) NOT NULL,
    nss VARCHAR(20) UNIQUE NOT NULL,
    PRIMARY KEY (num_paciente)
);

CREATE TABLE servicio (
    nombre VARCHAR(20) NOT NULL,
    gasto FLOAT NOT NULL,
    PRIMARY KEY (nombre)
);

CREATE TABLE facultativo (
    n_colegiado INTEGER NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    dir VARCHAR(20) NOT NULL,
    tlf VARCHAR(9) NOT NULL,
    servicio_nombre VARCHAR(20) NOT NULL,
    PRIMARY KEY (n_colegiado),
    FOREIGN KEY (servicio_nombre) REFERENCES servicio(nombre) ON DELETE NO ACTION
);

CREATE TABLE farmaco (
    n_registro INTEGER NOT NULL,
    ubicacion VARCHAR(20) NOT NULL,
    nombre_comercial VARCHAR(20) UNIQUE NOT NULL,
    nombre_clinico VARCHAR(20) UNIQUE NOT NULL,
    PRIMARY KEY (n_registro)
);

CREATE TABLE ingreso (
    cod_ingreso INTEGER NOT NULL,
    paciente_num_paciente INTEGER NOT NULL,
    fecha_ing DATE NOT NULL,
    fecha_alta DATE NOT NULL,
    diagnostico VARCHAR(20) NOT NULL,
    gasto FLOAT NOT NULL,
    servicio_nombre VARCHAR(20) NULL,
    facultativo_n_colegiado INTEGER NULL,
    PRIMARY KEY (cod_ingreso, paciente_num_paciente),
    FOREIGN KEY (paciente_num_paciente) REFERENCES paciente(num_paciente) ON DELETE CASCADE,
    FOREIGN KEY (servicio_nombre) REFERENCES servicio(nombre) ON DELETE SET NULL,
    FOREIGN KEY (facultativo_n_colegiado) REFERENCES facultativo(n_colegiado) ON DELETE SET NULL
);

CREATE TABLE ingreso_revisa_revisa_multi (
    cod_ingreso INTEGER NOT NULL,
    paciente_num_paciente INTEGER NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    informe VARCHAR(20) NOT NULL,
    PRIMARY KEY (cod_ingreso, paciente_num_paciente, fecha, hora, informe),
    FOREIGN KEY (cod_ingreso, paciente_num_paciente) REFERENCES ingreso(cod_ingreso, paciente_num_paciente) ON DELETE CASCADE
);

CREATE TABLE receta (
    ingreso_cod_ingreso INTEGER NOT NULL,
    ingreso_paciente_num_paciente INTEGER NOT NULL,
    farmaco_n_registro INTEGER NOT NULL,
    facultativo_n_colegiado INTEGER NOT NULL,
    PRIMARY KEY (ingreso_cod_ingreso, ingreso_paciente_num_paciente, farmaco_n_registro),
    FOREIGN KEY (ingreso_cod_ingreso, ingreso_paciente_num_paciente) REFERENCES ingreso(cod_ingreso, paciente_num_paciente) ON DELETE CASCADE,
    FOREIGN KEY (farmaco_n_registro) REFERENCES farmaco(n_registro) ON DELETE CASCADE,
    FOREIGN KEY (facultativo_n_colegiado) REFERENCES facultativo(n_colegiado) ON DELETE CASCADE
);

CREATE TABLE receta_receta_multi (
    ingreso_cod_ingreso INTEGER NOT NULL,
    ingreso_paciente_num_paciente INTEGER NOT NULL,
    farmaco_n_registro INTEGER NOT NULL,
    fecha_receta DATE NOT NULL,
    n_dosis INTEGER NOT NULL,
    PRIMARY KEY (ingreso_cod_ingreso, ingreso_paciente_num_paciente, farmaco_n_registro, fecha_receta, n_dosis),
    FOREIGN KEY (ingreso_cod_ingreso, ingreso_paciente_num_paciente, farmaco_n_registro) REFERENCES receta(ingreso_cod_ingreso, ingreso_paciente_num_paciente, farmaco_n_registro) ON DELETE CASCADE
);

CREATE TABLE consumo_general (
    servicio_nombre VARCHAR(20) NOT NULL,
    farmaco_n_registro INTEGER NOT NULL,
    PRIMARY KEY (servicio_nombre, farmaco_n_registro),
    FOREIGN KEY (servicio_nombre) REFERENCES servicio(nombre) ON DELETE CASCADE,
    FOREIGN KEY (farmaco_n_registro) REFERENCES farmaco(n_registro) ON DELETE CASCADE
);

CREATE TABLE consumo_general_fecha_consumo (
    servicio_nombre VARCHAR(20) NOT NULL,
    farmaco_n_registro INTEGER NOT NULL,
    fecha_consumo DATE NOT NULL,
    PRIMARY KEY (servicio_nombre, farmaco_n_registro, fecha_consumo),
    FOREIGN KEY (servicio_nombre, farmaco_n_registro) REFERENCES consumo_general(servicio_nombre, farmaco_n_registro) ON DELETE CASCADE
);

CREATE TABLE consumo_general_n_dosis (
    servicio_nombre VARCHAR(20) NOT NULL,
    farmaco_n_registro INTEGER NOT NULL,
    n_dosis INTEGER NOT NULL,
    PRIMARY KEY (servicio_nombre, farmaco_n_registro, n_dosis),
    FOREIGN KEY (servicio_nombre, farmaco_n_registro) REFERENCES consumo_general(servicio_nombre, farmaco_n_registro) ON DELETE CASCADE
);

