-- Script generado por GLSP-ER
-- Fecha: 27/11/2025, 16:58:41

CREATE TABLE Usuario (
    email VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL
);

CREATE TABLE Configuracion_Preferencias (
    tema INTEGER NOT NULL,
    idioma VARCHAR(2) NOT NULL,
    Usuario_email VARCHAR(20) NOT NULL,
    PRIMARY KEY (Usuario_email),
    FOREIGN KEY (Usuario_email) REFERENCES Usuario(tema) ON DELETE CASCADE
);

