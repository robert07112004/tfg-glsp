-- Fecha: 20/6/2026, 17:50:05

CREATE TABLE hospital (
    nombre_h VARCHAR(20) NOT NULL,
    dir VARCHAR(20) NOT NULL,
    fax VARCHAR(20) NOT NULL,
    PRIMARY KEY (nombre_h)
);

CREATE TABLE hospital_tlf (
    nombre_h VARCHAR(20) NOT NULL,
    tlf VARCHAR(9) NOT NULL,
    PRIMARY KEY (nombre_h, tlf),
    FOREIGN KEY (nombre_h) REFERENCES hospital(nombre_h) ON DELETE CASCADE
);

CREATE TABLE paciente (
    n_paciente INT NOT NULL,
    dni VARCHAR(9) NOT NULL,
    nom_pac VARCHAR(20) NOT NULL,
    dir VARCHAR(20) NOT NULL,
    tlf VARCHAR(9) NOT NULL,
    compañia VARCHAR(20) NOT NULL,
    n_ss VARCHAR(20) NOT NULL,
    PRIMARY KEY (n_paciente)
);

CREATE TABLE sala (
    num_sala INT NOT NULL,
    hospital_nombre_h VARCHAR(20) NOT NULL,
    PRIMARY KEY (num_sala, hospital_nombre_h),
    FOREIGN KEY (hospital_nombre_h) REFERENCES hospital(nombre_h) ON DELETE CASCADE
);

CREATE TABLE acude (
    hospital_nombre_h VARCHAR(20) NOT NULL,
    paciente_n_paciente INT NOT NULL,
    PRIMARY KEY (hospital_nombre_h, paciente_n_paciente),
    FOREIGN KEY (hospital_nombre_h) REFERENCES hospital(nombre_h) ON DELETE CASCADE,
    FOREIGN KEY (paciente_n_paciente) REFERENCES paciente(n_paciente) ON DELETE CASCADE
);

CREATE TABLE personal (
    dni VARCHAR(9) NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    dir VARCHAR(20) NOT NULL,
    tlf VARCHAR(9) NOT NULL,
    tipo_personal ENUM('administracion', 'sanitarios', 'Otro') NULL,
    hospital_nombre_h VARCHAR(20) NULL,
    PRIMARY KEY (dni),
    UNIQUE (dni, tipo_personal),
    FOREIGN KEY (hospital_nombre_h) REFERENCES hospital(nombre_h) ON DELETE SET NULL
);

CREATE TABLE admision (
    num_adm INT NOT NULL,
    fecha DATE NOT NULL,
    paciente_n_paciente INT NOT NULL,
    sala_num_sala INT NULL,
    sala_hospital_nombre_h VARCHAR(20) NULL,
    PRIMARY KEY (num_adm),
    FOREIGN KEY (paciente_n_paciente) REFERENCES paciente(n_paciente) ON DELETE NO ACTION,
    FOREIGN KEY (sala_num_sala, sala_hospital_nombre_h) REFERENCES sala(num_sala, hospital_nombre_h) ON DELETE SET NULL
);

CREATE TABLE administracion (
    dni VARCHAR(9) NOT NULL,
    tipo ENUM('administracion', 'sanitarios', 'Otro') DEFAULT 'administracion' NOT NULL,
    PRIMARY KEY (dni),
    CHECK (tipo = 'administracion'),
    FOREIGN KEY (dni, tipo) REFERENCES personal(dni, tipo_personal) ON DELETE CASCADE
);

CREATE TABLE sanitarios (
    dni VARCHAR(9) NOT NULL,
    tipo ENUM('administracion', 'sanitarios', 'Otro') DEFAULT 'sanitarios' NOT NULL,
    tipo_sanitarios ENUM('ats', 'medico') NOT NULL,
    PRIMARY KEY (dni),
    CHECK (tipo = 'sanitarios'),
    UNIQUE (dni, tipo_sanitarios),
    FOREIGN KEY (dni, tipo) REFERENCES personal(dni, tipo_personal) ON DELETE CASCADE
);

CREATE TABLE ats (
    dni VARCHAR(9) NOT NULL,
    tipo ENUM('ats', 'medico') DEFAULT 'ats' NOT NULL,
    PRIMARY KEY (dni),
    CHECK (tipo = 'ats'),
    FOREIGN KEY (dni, tipo) REFERENCES sanitarios(dni, tipo_sanitarios) ON DELETE CASCADE
);

CREATE TABLE medico (
    dni VARCHAR(9) NOT NULL,
    tipo ENUM('ats', 'medico') DEFAULT 'medico' NOT NULL,
    especialidad VARCHAR(20) NOT NULL,
    PRIMARY KEY (dni),
    CHECK (tipo = 'medico'),
    FOREIGN KEY (dni, tipo) REFERENCES sanitarios(dni, tipo_sanitarios) ON DELETE CASCADE
);

CREATE TABLE tratamiento (
    nom_tratamiento VARCHAR(20) NOT NULL,
    admision_num_adm INT NOT NULL,
    medico_dni VARCHAR(9) NULL,
    PRIMARY KEY (nom_tratamiento, admision_num_adm),
    FOREIGN KEY (admision_num_adm) REFERENCES admision(num_adm) ON DELETE CASCADE,
    FOREIGN KEY (medico_dni) REFERENCES medico(dni) ON DELETE SET NULL
);

CREATE TABLE resultado (
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    tratamiento_nom_tratamiento VARCHAR(20) NOT NULL,
    admision_num_adm INT NOT NULL,
    comentario VARCHAR(20) NOT NULL,
    PRIMARY KEY (fecha, hora, tratamiento_nom_tratamiento, admision_num_adm),
    FOREIGN KEY (tratamiento_nom_tratamiento, admision_num_adm) REFERENCES tratamiento(nom_tratamiento, admision_num_adm) ON DELETE CASCADE
);

