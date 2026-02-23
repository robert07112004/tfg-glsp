-- Fecha: 23/2/2026, 19:39:49

CREATE TABLE Proyecto_Investigacion (
    cod_proyecto INTEGER NOT NULL PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL,
    organismo_financiador VARCHAR(20) NOT NULL,
    dinero FLOAT NOT NULL
);

CREATE TABLE Profesor (
    DNI VARCHAR(20) NOT NULL PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL,
    despacho INTEGER NOT NULL
);

CREATE TABLE Departamento (
    nombre VARCHAR(20) NOT NULL PRIMARY KEY,
    remanente VARCHAR(20) NOT NULL
);

CREATE TABLE Pais (
    cod_pais INTEGER NOT NULL PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL
);

CREATE TABLE Categoria (
    tipo VARCHAR(20) NOT NULL PRIMARY KEY,
    dedicacion INTEGER NOT NULL
);

CREATE TABLE Viaje (
    cod_viaje INTEGER NOT NULL PRIMARY KEY,
    motivo VARCHAR(20) NOT NULL,
    ciudad_origen VARCHAR(20) NOT NULL,
    ciudad_destino VARCHAR(20) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    Realiza_DNI VARCHAR(20) NOT NULL,
    Financiado_cod_proyecto INTEGER NULL,
    Sufragado_nombre VARCHAR(20) NULL,
    Corresponde_cod_pais INTEGER NULL,
    FOREIGN KEY (Realiza_DNI) REFERENCES Profesor(DNI) ON DELETE CASCADE,
    FOREIGN KEY (Financiado_cod_proyecto) REFERENCES Proyecto_Investigacion(cod_proyecto),
    FOREIGN KEY (Sufragado_nombre) REFERENCES Departamento(nombre),
    FOREIGN KEY (Corresponde_cod_pais) REFERENCES Pais(cod_pais)
);

CREATE TABLE Trabaja (
    cod_proyecto INTEGER NOT NULL,
    DNI VARCHAR(20) NOT NULL,
    PRIMARY KEY (cod_proyecto, DNI),
    FOREIGN KEY (cod_proyecto) REFERENCES Proyecto_Investigacion(cod_proyecto),
    FOREIGN KEY (DNI) REFERENCES Profesor(DNI)
);

CREATE TABLE Trabaja_Periodo (
    cod_proyecto INTEGER NOT NULL,
    DNI VARCHAR(20) NOT NULL,
    Fecha_inicio DATE NOT NULL,
    Fecha_fin DATE NOT NULL,
    PRIMARY KEY (cod_proyecto, DNI, Fecha_inicio, Fecha_fin),
    FOREIGN KEY (cod_proyecto, DNI) REFERENCES Proyecto_Investigacion(cod_proyecto, DNI) ON DELETE CASCADE
);

CREATE TABLE Investigador_Principal (
    cod_proyecto INTEGER NOT NULL,
    DNI VARCHAR(20) NOT NULL,
    PRIMARY KEY (cod_proyecto, DNI),
    FOREIGN KEY (cod_proyecto) REFERENCES Proyecto_Investigacion(cod_proyecto),
    FOREIGN KEY (DNI) REFERENCES Profesor(DNI)
);

CREATE TABLE Investigador_Principal_Periodo (
    cod_proyecto INTEGER NOT NULL,
    DNI VARCHAR(20) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    PRIMARY KEY (cod_proyecto, DNI, fecha_inicio, fecha_fin),
    FOREIGN KEY (cod_proyecto, DNI) REFERENCES Proyecto_Investigacion(cod_proyecto, DNI) ON DELETE CASCADE
);

CREATE TABLE Adscrito (
    DNI VARCHAR(20) NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    PRIMARY KEY (DNI, nombre),
    FOREIGN KEY (DNI) REFERENCES Profesor(DNI),
    FOREIGN KEY (nombre) REFERENCES Departamento(nombre)
);

CREATE TABLE Adscrito_periodo (
    DNI VARCHAR(20) NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    PRIMARY KEY (DNI, nombre, fecha_inicio, fecha_fin),
    FOREIGN KEY (DNI, nombre) REFERENCES Profesor(DNI, nombre) ON DELETE CASCADE
);

CREATE TABLE Director (
    DNI VARCHAR(20) NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    PRIMARY KEY (DNI, nombre),
    FOREIGN KEY (DNI) REFERENCES Profesor(DNI),
    FOREIGN KEY (nombre) REFERENCES Departamento(nombre)
);

CREATE TABLE Director_periodo (
    DNI VARCHAR(20) NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    PRIMARY KEY (DNI, nombre, fecha_inicio, fecha_fin),
    FOREIGN KEY (DNI, nombre) REFERENCES Profesor(DNI, nombre) ON DELETE CASCADE
);

CREATE TABLE Dieta_DIaria (
    cod_pais INTEGER NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    PRIMARY KEY (cod_pais, tipo),
    FOREIGN KEY (cod_pais) REFERENCES Pais(cod_pais),
    FOREIGN KEY (tipo) REFERENCES Categoria(tipo)
);

CREATE TABLE Dieta_DIaria_dieta (
    cod_pais INTEGER NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    fecha_inicio DATE NOT NULL,
    manutencion FLOAT NOT NULL,
    alojamiento FLOAT NOT NULL,
    fecha_fin DATE NOT NULL,
    PRIMARY KEY (cod_pais, tipo, fecha_inicio, manutencion, alojamiento, fecha_fin),
    FOREIGN KEY (cod_pais, tipo) REFERENCES Pais(cod_pais, tipo) ON DELETE CASCADE
);

CREATE TABLE Pertenece (
    tipo VARCHAR(20) NOT NULL,
    DNI VARCHAR(20) NOT NULL,
    PRIMARY KEY (tipo, DNI),
    FOREIGN KEY (tipo) REFERENCES Categoria(tipo),
    FOREIGN KEY (DNI) REFERENCES Profesor(DNI)
);

CREATE TABLE Pertenece_periodo (
    tipo VARCHAR(20) NOT NULL,
    DNI VARCHAR(20) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    PRIMARY KEY (tipo, DNI, fecha_inicio, fecha_fin),
    FOREIGN KEY (tipo, DNI) REFERENCES Categoria(tipo, DNI) ON DELETE CASCADE
);

CREATE TABLE Gasto (
    cod_gasto_disc INTEGER NOT NULL,
    tipo_Gasto ENUM('Transporte', 'Alojamiento', 'Manutencion') NOT NULL,
    Genera_cod_viaje INTEGER NOT NULL,
    PRIMARY KEY (Genera_cod_viaje, cod_gasto_disc),
    UNIQUE (Genera_cod_viaje, cod_gasto_disc, tipo_Gasto),
    FOREIGN KEY (Genera_cod_viaje) REFERENCES Viaje(cod_viaje) ON DELETE CASCADE
);

CREATE TABLE Transporte (
    cod_viaje INTEGER NOT NULL,
    cod_gasto_disc INTEGER NOT NULL,
    tipo_Transporte VARCHAR(100) DEFAULT 'Transporte' NOT NULL,
    medio VARCHAR(20) NOT NULL,
    Nº_recibos INTEGER NOT NULL,
    importe_T FLOAT NOT NULL,
    PRIMARY KEY (cod_viaje, cod_gasto_disc),
    CHECK (tipo_Transporte = 'Transporte'),
    FOREIGN KEY (cod_viaje, cod_gasto_disc, tipo_Transporte) REFERENCES Gasto(Genera_cod_viaje, cod_gasto_disc, tipo_Gasto) ON DELETE CASCADE
);

CREATE TABLE Alojamiento (
    cod_viaje INTEGER NOT NULL,
    cod_gasto_disc INTEGER NOT NULL,
    tipo_Alojamiento VARCHAR(100) DEFAULT 'Alojamiento' NOT NULL,
    Nº_noches INTEGER NOT NULL,
    importe_A FLOAT NOT NULL,
    tipo_habitacion VARCHAR(20) NOT NULL,
    PRIMARY KEY (cod_viaje, cod_gasto_disc),
    CHECK (tipo_Alojamiento = 'Alojamiento'),
    FOREIGN KEY (cod_viaje, cod_gasto_disc, tipo_Alojamiento) REFERENCES Gasto(Genera_cod_viaje, cod_gasto_disc, tipo_Gasto) ON DELETE CASCADE
);

CREATE TABLE Manutencion (
    cod_viaje INTEGER NOT NULL,
    cod_gasto_disc INTEGER NOT NULL,
    tipo_Manutencion VARCHAR(100) DEFAULT 'Manutencion' NOT NULL,
    Nº_dias INTEGER NOT NULL,
    importe_M FLOAT NOT NULL,
    PRIMARY KEY (cod_viaje, cod_gasto_disc),
    CHECK (tipo_Manutencion = 'Manutencion'),
    FOREIGN KEY (cod_viaje, cod_gasto_disc, tipo_Manutencion) REFERENCES Gasto(Genera_cod_viaje, cod_gasto_disc, tipo_Gasto) ON DELETE CASCADE
);

