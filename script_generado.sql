-- Script generado por GLSP-ER
-- Fecha: 30/11/2025, 22:49:57

CREATE TABLE Libro (
    isbn VARCHAR(20) PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL
);

CREATE TABLE Capitulo (
    numero INTEGER PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    Libro_isbn VARCHAR(20) NOT NULL,
    PRIMARY KEY (numero, Libro_isbn),
    FOREIGN KEY (Libro_isbn) REFERENCES Libro(isbn) ON DELETE CASCADE
);

