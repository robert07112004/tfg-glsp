-- Fecha: 27/4/2026, 17:30:45

CREATE TABLE Medico (
    cod_medico INTEGER NOT NULL,
    PRIMARY KEY (cod_medico)
);

CREATE TABLE Paciente (
    cod_paciente INTEGER NOT NULL,
    PRIMARY KEY (cod_paciente)
);

CREATE TABLE Medicamento (
    cod_medicamento INTEGER NOT NULL,
    PRIMARY KEY (cod_medicamento)
);

CREATE TABLE Receta (
    Medico_cod_medico INTEGER NOT NULL,
    Paciente_cod_paciente INTEGER NOT NULL,
    Medicamento_cod_medicamento INTEGER NOT NULL,
    cod_receta INTEGER UNIQUE NOT NULL,
    dosis FLOAT NOT NULL,
    PRIMARY KEY (Medico_cod_medico, Paciente_cod_paciente, Medicamento_cod_medicamento),
    FOREIGN KEY (Medico_cod_medico) REFERENCES Medico(cod_medico) ON DELETE CASCADE,
    FOREIGN KEY (Paciente_cod_paciente) REFERENCES Paciente(cod_paciente) ON DELETE CASCADE,
    FOREIGN KEY (Medicamento_cod_medicamento) REFERENCES Medicamento(cod_medicamento) ON DELETE CASCADE
);

