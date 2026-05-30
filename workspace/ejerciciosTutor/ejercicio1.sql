-- Fecha: 24/5/2026, 22:07:51

CREATE TABLE Director (
    nombre VARCHAR(20) NOT NULL,
    nacionalidad VARCHAR(20) NOT NULL,
    PRIMARY KEY (nombre)
);

CREATE TABLE Pelicula (
    titulo VARCHAR(20) NOT NULL,
    nacionalidad VARCHAR(20) NOT NULL,
    productor VARCHAR(20) NOT NULL,
    fecha DATE NOT NULL,
    Director_nombre VARCHAR(20) NOT NULL,
    PRIMARY KEY (titulo),
    FOREIGN KEY (Director_nombre) REFERENCES Director(nombre) ON DELETE NO ACTION
);

CREATE TABLE Actor (
    nombre VARCHAR(20) NOT NULL,
    sexo CHAR(1) NOT NULL,
    nacionalidad VARCHAR(20) NOT NULL,
    PRIMARY KEY (nombre)
);

CREATE TABLE Socio (
    dni VARCHAR(20) NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    direccion VARCHAR(20) NOT NULL,
    tlf VARCHAR(9) NOT NULL,
    Avalado_por_dni VARCHAR(20) NULL,
    PRIMARY KEY (dni),
    FOREIGN KEY (Avalado_por_dni) REFERENCES Socio(dni) ON DELETE SET NULL
);

CREATE TABLE Ejemplar (
    num_ejemplar_disc INTEGER NOT NULL,
    Pelicula_titulo VARCHAR(20) NOT NULL,
    conservación VARCHAR(20) NOT NULL,
    PRIMARY KEY (num_ejemplar_disc, Pelicula_titulo),
    FOREIGN KEY (Pelicula_titulo) REFERENCES Pelicula(titulo) ON DELETE CASCADE
);

CREATE TABLE Participa (
    Pelicula_titulo VARCHAR(20) NOT NULL,
    Actor_nombre VARCHAR(20) NOT NULL,
    PRIMARY KEY (Pelicula_titulo, Actor_nombre),
    FOREIGN KEY (Pelicula_titulo) REFERENCES Pelicula(titulo) ON DELETE CASCADE,
    FOREIGN KEY (Actor_nombre) REFERENCES Actor(nombre) ON DELETE CASCADE
);

CREATE TABLE Alquilado (
    Ejemplar_num_ejemplar_disc INTEGER NOT NULL,
    Ejemplar_Pelicula_titulo VARCHAR(20) NOT NULL,
    Socio_dni VARCHAR(20) NOT NULL,
    fecha_c DATE NOT NULL,
    fecha_f DATE NOT NULL,
    PRIMARY KEY (Ejemplar_num_ejemplar_disc, Ejemplar_Pelicula_titulo, Socio_dni),
    FOREIGN KEY (Ejemplar_num_ejemplar_disc, Ejemplar_Pelicula_titulo) REFERENCES Ejemplar(num_ejemplar_disc, Pelicula_titulo) ON DELETE CASCADE,
    FOREIGN KEY (Socio_dni) REFERENCES Socio(dni) ON DELETE CASCADE
);

