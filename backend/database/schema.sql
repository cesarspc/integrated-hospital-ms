-- Schema for Distributed Hospital Management System
-- All nodes share this unified schema

-- Enable dblink extension for federated queries
CREATE EXTENSION IF NOT EXISTS dblink;

-- Core Tables (Spanish naming)

-- Table: tipodocumento
CREATE TABLE IF NOT EXISTS tipodocumento (
    id_tipodocumento SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: genero
CREATE TABLE IF NOT EXISTS genero (
    id_genero SERIAL PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE
);

-- Table: estado
CREATE TABLE IF NOT EXISTS estado (
    id_estado SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE
);

-- Table: persona
CREATE TABLE IF NOT EXISTS persona (
    id_persona SERIAL PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    id_tipodocumento INTEGER REFERENCES tipodocumento(id_tipodocumento),
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    id_genero INTEGER REFERENCES genero(id_genero),
    fecha_nacimiento DATE NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- Table: sede
CREATE TABLE IF NOT EXISTS sede (
    id_sede SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    ciudad VARCHAR(100),
    pais VARCHAR(100),
    nodo_database VARCHAR(100), -- Database connection string for this node
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: departamento
CREATE TABLE IF NOT EXISTS departamento (
    id_departamento SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    id_sede INTEGER REFERENCES sede(id_sede),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: cargo
CREATE TABLE IF NOT EXISTS cargo (
    id_cargo SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    salario_base DECIMAL(10, 2),
    activo BOOLEAN DEFAULT TRUE
);

-- Table: rol
CREATE TABLE IF NOT EXISTS rol (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    permisos TEXT,
    activo BOOLEAN DEFAULT TRUE
);

-- Table: empleado
CREATE TABLE IF NOT EXISTS empleado (
    id_empleado SERIAL PRIMARY KEY,
    id_persona INTEGER REFERENCES persona(id_persona) NOT NULL,
    id_cargo INTEGER REFERENCES cargo(id_cargo),
    id_departamento INTEGER REFERENCES departamento(id_departamento),
    id_rol INTEGER REFERENCES rol(id_rol),
    numero_empleado VARCHAR(20) UNIQUE NOT NULL,
    fecha_contratacion DATE NOT NULL,
    especialidad VARCHAR(100),
    licencia_medica VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: paciente
CREATE TABLE IF NOT EXISTS paciente (
    id_paciente SERIAL PRIMARY KEY,
    id_persona INTEGER REFERENCES persona(id_persona) NOT NULL,
    numero_historia VARCHAR(20) UNIQUE NOT NULL,
    grupo_sanguineo VARCHAR(5),
    alergias TEXT,
    enfermedades_cronicas TEXT,
    contacto_emergencia VARCHAR(100),
    telefono_emergencia VARCHAR(20),
    id_sede INTEGER REFERENCES sede(id_sede),
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: tipo_servicio
CREATE TABLE IF NOT EXISTS tipo_servicio (
    id_tipo_servicio SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    costo_base DECIMAL(10, 2),
    duracion_estimada INTEGER, -- in minutes
    activo BOOLEAN DEFAULT TRUE
);

-- Table: cita
CREATE TABLE IF NOT EXISTS cita (
    id_cita SERIAL PRIMARY KEY,
    id_paciente INTEGER REFERENCES paciente(id_paciente) NOT NULL,
    id_empleado INTEGER REFERENCES empleado(id_empleado) NOT NULL,
    id_tipo_servicio INTEGER REFERENCES tipo_servicio(id_tipo_servicio),
    fecha_hora TIMESTAMP NOT NULL,
    duracion INTEGER, -- in minutes
    motivo TEXT,
    observaciones TEXT,
    id_estado INTEGER REFERENCES estado(id_estado),
    id_sede INTEGER REFERENCES sede(id_sede),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP
);

-- Table: historialclinica
CREATE TABLE IF NOT EXISTS historialclinica (
    id_historial SERIAL PRIMARY KEY,
    id_paciente INTEGER REFERENCES paciente(id_paciente) NOT NULL,
    id_empleado INTEGER REFERENCES empleado(id_empleado) NOT NULL,
    id_cita INTEGER REFERENCES cita(id_cita),
    fecha_atencion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    motivo_consulta TEXT NOT NULL,
    sintomas TEXT,
    diagnostico TEXT,
    tratamiento TEXT,
    observaciones TEXT,
    id_sede INTEGER REFERENCES sede(id_sede),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: tiporeporte
CREATE TABLE IF NOT EXISTS tiporeporte (
    id_tiporeporte SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE
);

-- Table: reportemedico
CREATE TABLE IF NOT EXISTS reportemedico (
    id_reporte SERIAL PRIMARY KEY,
    id_historial INTEGER REFERENCES historialclinica(id_historial) NOT NULL,
    id_tiporeporte INTEGER REFERENCES tiporeporte(id_tiporeporte),
    titulo VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    resultados TEXT,
    conclusiones TEXT,
    fecha_reporte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_empleado INTEGER REFERENCES empleado(id_empleado),
    archivo_adjunto VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE
);

-- Table: medicamento
CREATE TABLE IF NOT EXISTS medicamento (
    id_medicamento SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    nombre_generico VARCHAR(200),
    descripcion TEXT,
    presentacion VARCHAR(100),
    concentracion VARCHAR(50),
    laboratorio VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: prescripcion
CREATE TABLE IF NOT EXISTS prescripcion (
    id_prescripcion SERIAL PRIMARY KEY,
    id_historial INTEGER REFERENCES historialclinica(id_historial) NOT NULL,
    id_medicamento INTEGER REFERENCES medicamento(id_medicamento) NOT NULL,
    dosis VARCHAR(100) NOT NULL,
    frecuencia VARCHAR(100) NOT NULL,
    duracion VARCHAR(100),
    instrucciones TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_prescripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: proveedor
CREATE TABLE IF NOT EXISTS proveedor (
    id_proveedor SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    razon_social VARCHAR(200),
    ruc VARCHAR(20) UNIQUE,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    contacto_principal VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: equipamiento
CREATE TABLE IF NOT EXISTS equipamiento (
    id_equipamiento SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    codigo VARCHAR(50) UNIQUE,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    numero_serie VARCHAR(100) UNIQUE,
    fecha_adquisicion DATE,
    costo_adquisicion DECIMAL(12, 2),
    id_departamento INTEGER REFERENCES departamento(id_departamento),
    id_sede INTEGER REFERENCES sede(id_sede),
    id_estado INTEGER REFERENCES estado(id_estado),
    fecha_ultimo_mantenimiento DATE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: provee (relationship between proveedor and medicamento/equipamiento)
CREATE TABLE IF NOT EXISTS provee (
    id_provee SERIAL PRIMARY KEY,
    id_proveedor INTEGER REFERENCES proveedor(id_proveedor) NOT NULL,
    id_medicamento INTEGER REFERENCES medicamento(id_medicamento),
    id_equipamiento INTEGER REFERENCES equipamiento(id_equipamiento),
    precio DECIMAL(10, 2),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    activo BOOLEAN DEFAULT TRUE,
    CHECK (id_medicamento IS NOT NULL OR id_equipamiento IS NOT NULL)
);

-- Table: auditoriaacceso
CREATE TABLE IF NOT EXISTS auditoriaacceso (
    id_auditoria SERIAL PRIMARY KEY,
    id_empleado INTEGER REFERENCES empleado(id_empleado),
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(100),
    registro_id INTEGER,
    descripcion TEXT,
    ip_address VARCHAR(50),
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resultado VARCHAR(20) -- 'exitoso', 'fallido'
);

-- Indexes for better performance on distributed queries
CREATE INDEX IF NOT EXISTS idx_persona_documento ON persona(numero_documento);
CREATE INDEX IF NOT EXISTS idx_paciente_historia ON paciente(numero_historia);
CREATE INDEX IF NOT EXISTS idx_paciente_sede ON paciente(id_sede);
CREATE INDEX IF NOT EXISTS idx_empleado_numero ON empleado(numero_empleado);
CREATE INDEX IF NOT EXISTS idx_cita_paciente ON cita(id_paciente);
CREATE INDEX IF NOT EXISTS idx_cita_empleado ON cita(id_empleado);
CREATE INDEX IF NOT EXISTS idx_cita_fecha ON cita(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_cita_sede ON cita(id_sede);
CREATE INDEX IF NOT EXISTS idx_historial_paciente ON historialclinica(id_paciente);
CREATE INDEX IF NOT EXISTS idx_historial_sede ON historialclinica(id_sede);
CREATE INDEX IF NOT EXISTS idx_equipamiento_sede ON equipamiento(id_sede);
CREATE INDEX IF NOT EXISTS idx_auditoria_empleado ON auditoriaacceso(id_empleado);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoriaacceso(fecha_hora);

-- Insert initial data for core tables
INSERT INTO tipodocumento (nombre, descripcion) VALUES 
    ('DNI', 'Documento Nacional de Identidad'),
    ('Pasaporte', 'Pasaporte'),
    ('Carnet de Extranjería', 'Carnet de Extranjería'),
    ('RUC', 'Registro Único de Contribuyentes')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO genero (nombre, descripcion) VALUES 
    ('Masculino', 'Género Masculino'),
    ('Femenino', 'Género Femenino'),
    ('Otro', 'Otro género')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO estado (nombre, descripcion) VALUES 
    ('Pendiente', 'Estado pendiente'),
    ('Confirmado', 'Estado confirmado'),
    ('En Proceso', 'Estado en proceso'),
    ('Completado', 'Estado completado'),
    ('Cancelado', 'Estado cancelado'),
    ('Operativo', 'Equipo operativo'),
    ('En Mantenimiento', 'Equipo en mantenimiento'),
    ('Fuera de Servicio', 'Equipo fuera de servicio')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO cargo (nombre, descripcion, salario_base) VALUES 
    ('Médico General', 'Médico de atención general', 5000.00),
    ('Médico Especialista', 'Médico con especialización', 8000.00),
    ('Enfermero/a', 'Personal de enfermería', 3000.00),
    ('Técnico de Laboratorio', 'Técnico de laboratorio clínico', 2500.00),
    ('Administrador', 'Personal administrativo', 3500.00),
    ('Recepcionista', 'Personal de recepción', 2000.00)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO rol (nombre, descripcion, permisos) VALUES 
    ('Administrador', 'Acceso total al sistema', 'all'),
    ('Médico', 'Acceso a consultas y historiales clínicos', 'read,write:paciente,historialclinica,cita'),
    ('Enfermero', 'Acceso limitado a información de pacientes', 'read:paciente,historialclinica'),
    ('Recepcionista', 'Gestión de citas y registro de pacientes', 'read,write:paciente,cita'),
    ('Farmacéutico', 'Gestión de medicamentos y prescripciones', 'read,write:medicamento,prescripcion')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO tipo_servicio (nombre, descripcion, costo_base, duracion_estimada) VALUES 
    ('Consulta General', 'Consulta médica general', 50.00, 30),
    ('Consulta Especializada', 'Consulta con médico especialista', 100.00, 45),
    ('Análisis de Laboratorio', 'Exámenes de laboratorio', 80.00, 60),
    ('Radiografía', 'Estudios radiográficos', 120.00, 30),
    ('Ecografía', 'Estudios ecográficos', 150.00, 45),
    ('Emergencia', 'Atención de emergencia', 200.00, 60)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO tiporeporte (nombre, descripcion) VALUES 
    ('Análisis de Sangre', 'Reporte de análisis de sangre'),
    ('Análisis de Orina', 'Reporte de análisis de orina'),
    ('Radiografía', 'Reporte de radiografía'),
    ('Tomografía', 'Reporte de tomografía'),
    ('Resonancia Magnética', 'Reporte de resonancia magnética'),
    ('Ecografía', 'Reporte de ecografía'),
    ('Electrocardiograma', 'Reporte de electrocardiograma')
ON CONFLICT (nombre) DO NOTHING;
