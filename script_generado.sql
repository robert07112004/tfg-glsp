-- Fecha: 19/2/2026, 20:50:47

CREATE TABLE Administrador (
    Num_colegiado INTEGER NOT NULL PRIMARY KEY,
    DNI VARCHAR(10) NOT NULL UNIQUE,
    Nombre VARCHAR(10) NOT NULL
);

CREATE TABLE Comunidaddevecinos (
    Cod_comunidad INTEGER NOT NULL PRIMARY KEY,
    Nombre VARCHAR(20) NOT NULL,
    Calle VARCHAR(20) NOT NULL,
    CP INTEGER NOT NULL,
    Poblacion VARCHAR(15) NOT NULL,
    Gestiona_Num_colegiado INTEGER NULL,
    Horarios VARCHAR(20) NOT NULL,
    FOREIGN KEY (Gestiona_Num_colegiado) REFERENCES Administrador(Num_colegiado)
);

CREATE TABLE Compañia (
    CIF VARCHAR(20) NOT NULL PRIMARY KEY,
    Nombre VARCHAR(20) NOT NULL,
    Direccion VARCHAR(50) NOT NULL,
    Telefono INTEGER NOT NULL,
    Persona_contacto VARCHAR(20) NOT NULL
);

CREATE TABLE Banco (
    Cod_banco INTEGER NOT NULL PRIMARY KEY,
    Persona_contacto VARCHAR(20) NOT NULL,
    Nombre VARCHAR(20) NOT NULL
);

CREATE TABLE Cuenta (
    id_cuenta_disc INTEGER NOT NULL,
    saldo FLOAT NOT NULL,
    DC INTEGER NOT NULL,
    numero INTEGER NOT NULL,
    sucursal INTEGER NOT NULL,
    Tiene_Cod_banco INTEGER NOT NULL,
    Controlada_Cod_comunidad INTEGER NOT NULL UNIQUE,
    PRIMARY KEY (Tiene_Cod_banco, id_cuenta_disc),
    FOREIGN KEY (Tiene_Cod_banco) REFERENCES Banco(Cod_banco) ON DELETE CASCADE,
    FOREIGN KEY (Controlada_Cod_comunidad) REFERENCES Comunidaddevecinos(Cod_comunidad)
);

CREATE TABLE Propiedad (
    Porcentaje FLOAT NOT NULL,
    Numero_cuenta INTEGER NOT NULL,
    Nombre_prop VARCHAR(20) NOT NULL,
    Telefono INTEGER NOT NULL,
    Direccion_prop VARCHAR(50) NOT NULL,
    Nombre_inquilino VARCHAR(20) NOT NULL,
    Telefono INTEGER NOT NULL,
    Portal_disc INTEGER NOT NULL,
    Planta_disc INTEGER NOT NULL,
    Letra_disc VARCHAR(1) NOT NULL,
    tipo_Propiedad ENUM('VIvienda_Particular', 'Oficina', 'Local_Comercial') NOT NULL,
    Consta_Cod_comunidad INTEGER NOT NULL,
    Vocal_Cod_comunidad INTEGER NOT NULL,
    Presidente_Cod_comunidad INTEGER NOT NULL UNIQUE,
    PRIMARY KEY (Consta_Cod_comunidad, Portal_disc, Planta_disc, Letra_disc),
    UNIQUE (Consta_Cod_comunidad, Portal_disc, Planta_disc, Letra_disc, tipo_Propiedad),
    FOREIGN KEY (Consta_Cod_comunidad) REFERENCES Comunidaddevecinos(Cod_comunidad) ON DELETE CASCADE,
    FOREIGN KEY (Vocal_Cod_comunidad) REFERENCES Comunidaddevecinos(Cod_comunidad),
    FOREIGN KEY (Presidente_Cod_comunidad) REFERENCES Comunidaddevecinos(Cod_comunidad)
);

CREATE TABLE Contrata (
    Cod_comunidad INTEGER NOT NULL,
    CIF VARCHAR(20) NOT NULL,
    PRIMARY KEY (Cod_comunidad, CIF),
    FOREIGN KEY (Cod_comunidad) REFERENCES Comunidaddevecinos(Cod_comunidad),
    FOREIGN KEY (CIF) REFERENCES Compañia(CIF)
);

CREATE TABLE Recibo_Compañia (
    Num_recibo INTEGER NOT NULL PRIMARY KEY,
    Importe FLOAT NOT NULL,
    Fecha DATE NOT NULL,
    Emite_CIF VARCHAR(20) NULL,
    Secarga_Cod_banco INTEGER NULL,
    Secarga_id_cuenta_disc INTEGER NULL,
    FOREIGN KEY (Emite_CIF) REFERENCES Compañia(CIF),
    FOREIGN KEY (Secarga_Cod_banco, Secarga_id_cuenta_disc) REFERENCES Cuenta(Cod_banco, id_cuenta_disc) ON DELETE CASCADE
);

CREATE TABLE VIvienda_Particular (
    Portal_disc INTEGER NOT NULL,
    Planta_disc INTEGER NOT NULL,
    Letra_disc VARCHAR(1) NOT NULL,
    Cod_comunidad INTEGER NOT NULL,
    tipo_VIvienda_Particular VARCHAR(100) DEFAULT 'VIvienda_Particular' NOT NULL,
    Num_habitaciones INTEGER NOT NULL,
    PRIMARY KEY (Portal_disc, Planta_disc, Letra_disc, Cod_comunidad),
    CHECK (tipo_VIvienda_Particular = 'VIvienda_Particular'),
    FOREIGN KEY (Portal_disc, Planta_disc, Letra_disc, Cod_comunidad, tipo_VIvienda_Particular) REFERENCES Propiedad(Portal_disc, Planta_disc, Letra_disc, Cod_comunidad, tipo_Propiedad) ON DELETE CASCADE
);

CREATE TABLE Oficina (
    Portal_disc INTEGER NOT NULL,
    Planta_disc INTEGER NOT NULL,
    Letra_disc VARCHAR(1) NOT NULL,
    Cod_comunidad INTEGER NOT NULL,
    tipo_Oficina VARCHAR(100) DEFAULT 'Oficina' NOT NULL,
    Actividad VARCHAR(20) NOT NULL,
    PRIMARY KEY (Portal_disc, Planta_disc, Letra_disc, Cod_comunidad),
    CHECK (tipo_Oficina = 'Oficina'),
    FOREIGN KEY (Portal_disc, Planta_disc, Letra_disc, Cod_comunidad, tipo_Oficina) REFERENCES Propiedad(Portal_disc, Planta_disc, Letra_disc, Cod_comunidad, tipo_Propiedad) ON DELETE CASCADE
);

CREATE TABLE Local_Comercial (
    Portal_disc INTEGER NOT NULL,
    Planta_disc INTEGER NOT NULL,
    Letra_disc VARCHAR(1) NOT NULL,
    Cod_comunidad INTEGER NOT NULL,
    tipo_Local_Comercial VARCHAR(100) DEFAULT 'Local_Comercial' NOT NULL,
    Tipo_comercio VARCHAR(20) NOT NULL,
    Horario DATE NOT NULL,
    PRIMARY KEY (Portal_disc, Planta_disc, Letra_disc, Cod_comunidad),
    CHECK (tipo_Local_Comercial = 'Local_Comercial'),
    FOREIGN KEY (Portal_disc, Planta_disc, Letra_disc, Cod_comunidad, tipo_Local_Comercial) REFERENCES Propiedad(Portal_disc, Planta_disc, Letra_disc, Cod_comunidad, tipo_Propiedad) ON DELETE CASCADE
);

CREATE TABLE Recibo_Cuota_Comunidad (
    Num_recibo INTEGER NOT NULL PRIMARY KEY,
    Estado VARCHAR(20) NOT NULL,
    Fecha DATE NOT NULL,
    importe FLOAT NOT NULL,
    Corresponde_Cod_comunidad INTEGER NOT NULL,
    Corresponde_Portal_disc INTEGER NOT NULL,
    Corresponde_Planta_disc INTEGER NOT NULL,
    Corresponde_Letra_disc VARCHAR(1) NOT NULL,
    FOREIGN KEY (Corresponde_Cod_comunidad, Corresponde_Portal_disc, Corresponde_Planta_disc, Corresponde_Letra_disc) REFERENCES Propiedad(Cod_comunidad, Portal_disc, Planta_disc, Letra_disc) ON DELETE CASCADE
);

