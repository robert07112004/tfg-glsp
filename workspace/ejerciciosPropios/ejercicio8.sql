-- Fecha: 30/5/2026, 17:56:56

CREATE TABLE especie_arbol (
    cod_especie INTEGER NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    familia VARCHAR(20) NOT NULL,
    PRIMARY KEY (cod_especie)
);

CREATE TABLE lugar (
    nombre VARCHAR(20) NOT NULL,
    calle VARCHAR(20) NOT NULL,
    mapa VARCHAR(20) NOT NULL,
    PRIMARY KEY (nombre)
);

CREATE TABLE operario (
    cod_empleado INTEGER NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    tlf VARCHAR(9) NOT NULL,
    PRIMARY KEY (cod_empleado)
);

CREATE TABLE ejemplar (
    num_ej INTEGER NOT NULL,
    especie_arbol_cod_especie INTEGER NOT NULL,
    foto_inicial VARCHAR(20) NOT NULL,
    descrip_cont VARCHAR(20) NOT NULL,
    tipo_ejemplar ENUM('actual', 'desaparecido') NOT NULL,
    lugar_nombre VARCHAR(20) NULL,
    coordenadas VARCHAR(20) NULL,
    PRIMARY KEY (num_ej, especie_arbol_cod_especie),
    UNIQUE (num_ej, especie_arbol_cod_especie, tipo_ejemplar),
    FOREIGN KEY (especie_arbol_cod_especie) REFERENCES especie_arbol(cod_especie) ON DELETE CASCADE,
    FOREIGN KEY (lugar_nombre) REFERENCES lugar(nombre) ON DELETE SET NULL
);

CREATE TABLE actividad (
    cod_actividad INTEGER NOT NULL,
    ejemplar_num_ej INTEGER NOT NULL,
    especie_arbol_cod_especie INTEGER NOT NULL,
    hora_i DATE NOT NULL,
    hora_f DATE NOT NULL,
    tipo_actividad ENUM('poda', 'medicion', 'limpieza', 'plaga') NOT NULL,
    PRIMARY KEY (cod_actividad, ejemplar_num_ej, especie_arbol_cod_especie),
    UNIQUE (cod_actividad, ejemplar_num_ej, especie_arbol_cod_especie, tipo_actividad),
    FOREIGN KEY (ejemplar_num_ej, especie_arbol_cod_especie) REFERENCES ejemplar(num_ej, especie_arbol_cod_especie) ON DELETE CASCADE
);

CREATE TABLE participa (
    actividad_cod_actividad INTEGER NOT NULL,
    actividad_ejemplar_num_ej INTEGER NOT NULL,
    actividad_especie_arbol_cod_especie INTEGER NOT NULL,
    operario_cod_empleado INTEGER NOT NULL,
    PRIMARY KEY (actividad_cod_actividad, actividad_ejemplar_num_ej, actividad_especie_arbol_cod_especie, operario_cod_empleado),
    FOREIGN KEY (actividad_cod_actividad, actividad_ejemplar_num_ej, actividad_especie_arbol_cod_especie) REFERENCES actividad(cod_actividad, ejemplar_num_ej, especie_arbol_cod_especie) ON DELETE CASCADE,
    FOREIGN KEY (operario_cod_empleado) REFERENCES operario(cod_empleado) ON DELETE CASCADE
);

CREATE TABLE desaparecido (
    num_ej INTEGER NOT NULL,
    especie_arbol_cod_especie INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'desaparecido' NOT NULL,
    PRIMARY KEY (num_ej, especie_arbol_cod_especie),
    CHECK (tipo = 'desaparecido'),
    FOREIGN KEY (num_ej, especie_arbol_cod_especie, tipo) REFERENCES ejemplar(num_ej, especie_arbol_cod_especie, tipo_ejemplar) ON DELETE CASCADE
);

CREATE TABLE actual (
    num_ej INTEGER NOT NULL,
    especie_arbol_cod_especie INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'actual' NOT NULL,
    PRIMARY KEY (num_ej, especie_arbol_cod_especie),
    CHECK (tipo = 'actual'),
    FOREIGN KEY (num_ej, especie_arbol_cod_especie, tipo) REFERENCES ejemplar(num_ej, especie_arbol_cod_especie, tipo_ejemplar) ON DELETE CASCADE
);

CREATE TABLE poda (
    cod_actividad INTEGER NOT NULL,
    ejemplar_num_ej INTEGER NOT NULL,
    especie_arbol_cod_especie INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'poda' NOT NULL,
    foto VARCHAR(20) NOT NULL,
    comentarios VARCHAR(20) NOT NULL,
    PRIMARY KEY (cod_actividad, ejemplar_num_ej, especie_arbol_cod_especie),
    CHECK (tipo = 'poda'),
    FOREIGN KEY (cod_actividad, ejemplar_num_ej, especie_arbol_cod_especie, tipo) REFERENCES actividad(cod_actividad, ejemplar_num_ej, especie_arbol_cod_especie, tipo_actividad) ON DELETE CASCADE
);

CREATE TABLE medicion (
    cod_actividad INTEGER NOT NULL,
    ejemplar_num_ej INTEGER NOT NULL,
    especie_arbol_cod_especie INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'medicion' NOT NULL,
    altura FLOAT NOT NULL,
    edad_rel INTEGER NOT NULL,
    PRIMARY KEY (cod_actividad, ejemplar_num_ej, especie_arbol_cod_especie),
    CHECK (tipo = 'medicion'),
    FOREIGN KEY (cod_actividad, ejemplar_num_ej, especie_arbol_cod_especie, tipo) REFERENCES actividad(cod_actividad, ejemplar_num_ej, especie_arbol_cod_especie, tipo_actividad) ON DELETE CASCADE
);

CREATE TABLE limpieza (
    cod_actividad INTEGER NOT NULL,
    ejemplar_num_ej INTEGER NOT NULL,
    especie_arbol_cod_especie INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'limpieza' NOT NULL,
    descripcion VARCHAR(20) NOT NULL,
    PRIMARY KEY (cod_actividad, ejemplar_num_ej, especie_arbol_cod_especie),
    CHECK (tipo = 'limpieza'),
    FOREIGN KEY (cod_actividad, ejemplar_num_ej, especie_arbol_cod_especie, tipo) REFERENCES actividad(cod_actividad, ejemplar_num_ej, especie_arbol_cod_especie, tipo_actividad) ON DELETE CASCADE
);

CREATE TABLE plaga (
    cod_actividad INTEGER NOT NULL,
    ejemplar_num_ej INTEGER NOT NULL,
    especie_arbol_cod_especie INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'plaga' NOT NULL,
    daños VARCHAR(20) NOT NULL,
    especie VARCHAR(20) NOT NULL,
    PRIMARY KEY (cod_actividad, ejemplar_num_ej, especie_arbol_cod_especie),
    CHECK (tipo = 'plaga'),
    FOREIGN KEY (cod_actividad, ejemplar_num_ej, especie_arbol_cod_especie, tipo) REFERENCES actividad(cod_actividad, ejemplar_num_ej, especie_arbol_cod_especie, tipo_actividad) ON DELETE CASCADE
);

