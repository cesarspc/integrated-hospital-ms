-- Federated Views for Distributed Hospital Management System
-- These views use dblink to query across multiple database nodes

-- Function to get all remote nodes configuration
CREATE OR REPLACE FUNCTION get_remote_nodes()
RETURNS TABLE(id_sede INTEGER, nombre VARCHAR, nodo_database VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id_sede, s.nombre, s.nodo_database
    FROM sede s
    WHERE s.nodo_database IS NOT NULL AND s.activo = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Federated view: All patients across all nodes
CREATE OR REPLACE VIEW v_pacientes_federados AS
WITH local_pacientes AS (
    SELECT 
        p.id_paciente,
        p.numero_historia,
        per.nombres,
        per.apellidos,
        per.numero_documento,
        p.grupo_sanguineo,
        p.alergias,
        s.nombre AS sede_nombre,
        'LOCAL' AS nodo_origen,
        p.fecha_registro
    FROM paciente p
    INNER JOIN persona per ON p.id_persona = per.id_persona
    LEFT JOIN sede s ON p.id_sede = s.id_sede
    WHERE p.activo = TRUE
)
SELECT * FROM local_pacientes;

-- Federated view: All appointments across all nodes
CREATE OR REPLACE VIEW v_citas_federadas AS
WITH local_citas AS (
    SELECT 
        c.id_cita,
        c.fecha_hora,
        c.motivo,
        p.numero_historia,
        per_pac.nombres || ' ' || per_pac.apellidos AS paciente_nombre,
        e.numero_empleado,
        per_emp.nombres || ' ' || per_emp.apellidos AS empleado_nombre,
        e.especialidad,
        ts.nombre AS tipo_servicio,
        est.nombre AS estado,
        s.nombre AS sede_nombre,
        'LOCAL' AS nodo_origen
    FROM cita c
    INNER JOIN paciente p ON c.id_paciente = p.id_paciente
    INNER JOIN persona per_pac ON p.id_persona = per_pac.id_persona
    INNER JOIN empleado e ON c.id_empleado = e.id_empleado
    INNER JOIN persona per_emp ON e.id_persona = per_emp.id_persona
    LEFT JOIN tipo_servicio ts ON c.id_tipo_servicio = ts.id_tipo_servicio
    LEFT JOIN estado est ON c.id_estado = est.id_estado
    LEFT JOIN sede s ON c.id_sede = s.id_sede
)
SELECT * FROM local_citas;

-- Federated view: All medical records across all nodes
CREATE OR REPLACE VIEW v_historialclinica_federado AS
WITH local_historial AS (
    SELECT 
        h.id_historial,
        h.fecha_atencion,
        p.numero_historia,
        per_pac.nombres || ' ' || per_pac.apellidos AS paciente_nombre,
        e.numero_empleado,
        per_emp.nombres || ' ' || per_emp.apellidos AS medico_nombre,
        h.motivo_consulta,
        h.diagnostico,
        h.tratamiento,
        s.nombre AS sede_nombre,
        'LOCAL' AS nodo_origen
    FROM historialclinica h
    INNER JOIN paciente p ON h.id_paciente = p.id_paciente
    INNER JOIN persona per_pac ON p.id_persona = per_pac.id_persona
    INNER JOIN empleado e ON h.id_empleado = e.id_empleado
    INNER JOIN persona per_emp ON e.id_persona = per_emp.id_persona
    LEFT JOIN sede s ON h.id_sede = s.id_sede
)
SELECT * FROM local_historial;

-- Federated view: All employees across all nodes
CREATE OR REPLACE VIEW v_empleados_federados AS
WITH local_empleados AS (
    SELECT 
        e.id_empleado,
        e.numero_empleado,
        per.nombres,
        per.apellidos,
        per.numero_documento,
        per.email,
        per.telefono,
        c.nombre AS cargo_nombre,
        d.nombre AS departamento_nombre,
        r.nombre AS rol_nombre,
        e.especialidad,
        s.nombre AS sede_nombre,
        'LOCAL' AS nodo_origen
    FROM empleado e
    INNER JOIN persona per ON e.id_persona = per.id_persona
    LEFT JOIN cargo c ON e.id_cargo = c.id_cargo
    LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
    LEFT JOIN rol r ON e.id_rol = r.id_rol
    LEFT JOIN sede s ON d.id_sede = s.id_sede
    WHERE e.activo = TRUE
)
SELECT * FROM local_empleados;

-- Function to search patient across all nodes using dblink
CREATE OR REPLACE FUNCTION buscar_paciente_federado(p_numero_documento VARCHAR)
RETURNS TABLE(
    id_paciente INTEGER,
    numero_historia VARCHAR,
    nombres VARCHAR,
    apellidos VARCHAR,
    numero_documento VARCHAR,
    grupo_sanguineo VARCHAR,
    sede_nombre VARCHAR,
    nodo_origen VARCHAR
) AS $$
DECLARE
    nodo RECORD;
    query TEXT;
BEGIN
    -- Return local results first
    RETURN QUERY
    SELECT 
        p.id_paciente,
        p.numero_historia,
        per.nombres,
        per.apellidos,
        per.numero_documento,
        p.grupo_sanguineo,
        s.nombre AS sede_nombre,
        'LOCAL'::VARCHAR AS nodo_origen
    FROM paciente p
    INNER JOIN persona per ON p.id_persona = per.id_persona
    LEFT JOIN sede s ON p.id_sede = s.id_sede
    WHERE per.numero_documento = p_numero_documento AND p.activo = TRUE;

    -- Query remote nodes if dblink is available
    FOR nodo IN SELECT * FROM get_remote_nodes() LOOP
        BEGIN
            query := format(
                'SELECT p.id_paciente, p.numero_historia, per.nombres, per.apellidos, 
                        per.numero_documento, p.grupo_sanguineo, s.nombre, %L
                 FROM paciente p
                 INNER JOIN persona per ON p.id_persona = per.id_persona
                 LEFT JOIN sede s ON p.id_sede = s.id_sede
                 WHERE per.numero_documento = %L AND p.activo = TRUE',
                nodo.nombre,
                p_numero_documento
            );
            
            RETURN QUERY
            SELECT * FROM dblink(nodo.nodo_database, query) AS t(
                id_paciente INTEGER,
                numero_historia VARCHAR,
                nombres VARCHAR,
                apellidos VARCHAR,
                numero_documento VARCHAR,
                grupo_sanguineo VARCHAR,
                sede_nombre VARCHAR,
                nodo_origen VARCHAR
            );
        EXCEPTION WHEN OTHERS THEN
            -- Log error but continue with other nodes
            RAISE NOTICE 'Error querying node %: %', nodo.nombre, SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get patient medical history across all nodes
CREATE OR REPLACE FUNCTION obtener_historial_completo_paciente(p_numero_historia VARCHAR)
RETURNS TABLE(
    id_historial INTEGER,
    fecha_atencion TIMESTAMP,
    medico_nombre VARCHAR,
    motivo_consulta TEXT,
    diagnostico TEXT,
    tratamiento TEXT,
    sede_nombre VARCHAR,
    nodo_origen VARCHAR
) AS $$
DECLARE
    nodo RECORD;
    query TEXT;
BEGIN
    -- Return local results first
    RETURN QUERY
    SELECT 
        h.id_historial,
        h.fecha_atencion,
        per_emp.nombres || ' ' || per_emp.apellidos AS medico_nombre,
        h.motivo_consulta,
        h.diagnostico,
        h.tratamiento,
        s.nombre AS sede_nombre,
        'LOCAL'::VARCHAR AS nodo_origen
    FROM historialclinica h
    INNER JOIN paciente p ON h.id_paciente = p.id_paciente
    INNER JOIN empleado e ON h.id_empleado = e.id_empleado
    INNER JOIN persona per_emp ON e.id_persona = per_emp.id_persona
    LEFT JOIN sede s ON h.id_sede = s.id_sede
    WHERE p.numero_historia = p_numero_historia
    ORDER BY h.fecha_atencion DESC;

    -- Query remote nodes if dblink is available
    FOR nodo IN SELECT * FROM get_remote_nodes() LOOP
        BEGIN
            query := format(
                'SELECT h.id_historial, h.fecha_atencion, 
                        per_emp.nombres || '' '' || per_emp.apellidos,
                        h.motivo_consulta, h.diagnostico, h.tratamiento,
                        s.nombre, %L
                 FROM historialclinica h
                 INNER JOIN paciente p ON h.id_paciente = p.id_paciente
                 INNER JOIN empleado e ON h.id_empleado = e.id_empleado
                 INNER JOIN persona per_emp ON e.id_persona = per_emp.id_persona
                 LEFT JOIN sede s ON h.id_sede = s.id_sede
                 WHERE p.numero_historia = %L
                 ORDER BY h.fecha_atencion DESC',
                nodo.nombre,
                p_numero_historia
            );
            
            RETURN QUERY
            SELECT * FROM dblink(nodo.nodo_database, query) AS t(
                id_historial INTEGER,
                fecha_atencion TIMESTAMP,
                medico_nombre VARCHAR,
                motivo_consulta TEXT,
                diagnostico TEXT,
                tratamiento TEXT,
                sede_nombre VARCHAR,
                nodo_origen VARCHAR
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error querying node %: %', nodo.nombre, SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get all appointments for a specific date range across all nodes
CREATE OR REPLACE FUNCTION obtener_citas_rango_fechas(p_fecha_inicio TIMESTAMP, p_fecha_fin TIMESTAMP)
RETURNS TABLE(
    id_cita INTEGER,
    fecha_hora TIMESTAMP,
    paciente_nombre VARCHAR,
    empleado_nombre VARCHAR,
    tipo_servicio VARCHAR,
    estado VARCHAR,
    sede_nombre VARCHAR,
    nodo_origen VARCHAR
) AS $$
DECLARE
    nodo RECORD;
    query TEXT;
BEGIN
    -- Return local results first
    RETURN QUERY
    SELECT 
        c.id_cita,
        c.fecha_hora,
        per_pac.nombres || ' ' || per_pac.apellidos AS paciente_nombre,
        per_emp.nombres || ' ' || per_emp.apellidos AS empleado_nombre,
        ts.nombre AS tipo_servicio,
        est.nombre AS estado,
        s.nombre AS sede_nombre,
        'LOCAL'::VARCHAR AS nodo_origen
    FROM cita c
    INNER JOIN paciente p ON c.id_paciente = p.id_paciente
    INNER JOIN persona per_pac ON p.id_persona = per_pac.id_persona
    INNER JOIN empleado e ON c.id_empleado = e.id_empleado
    INNER JOIN persona per_emp ON e.id_persona = per_emp.id_persona
    LEFT JOIN tipo_servicio ts ON c.id_tipo_servicio = ts.id_tipo_servicio
    LEFT JOIN estado est ON c.id_estado = est.id_estado
    LEFT JOIN sede s ON c.id_sede = s.id_sede
    WHERE c.fecha_hora BETWEEN p_fecha_inicio AND p_fecha_fin
    ORDER BY c.fecha_hora;

    -- Query remote nodes if dblink is available
    FOR nodo IN SELECT * FROM get_remote_nodes() LOOP
        BEGIN
            query := format(
                'SELECT c.id_cita, c.fecha_hora,
                        per_pac.nombres || '' '' || per_pac.apellidos,
                        per_emp.nombres || '' '' || per_emp.apellidos,
                        ts.nombre, est.nombre, s.nombre, %L
                 FROM cita c
                 INNER JOIN paciente p ON c.id_paciente = p.id_paciente
                 INNER JOIN persona per_pac ON p.id_persona = per_pac.id_persona
                 INNER JOIN empleado e ON c.id_empleado = e.id_empleado
                 INNER JOIN persona per_emp ON e.id_persona = per_emp.id_persona
                 LEFT JOIN tipo_servicio ts ON c.id_tipo_servicio = ts.id_tipo_servicio
                 LEFT JOIN estado est ON c.id_estado = est.id_estado
                 LEFT JOIN sede s ON c.id_sede = s.id_sede
                 WHERE c.fecha_hora BETWEEN %L AND %L
                 ORDER BY c.fecha_hora',
                nodo.nombre,
                p_fecha_inicio,
                p_fecha_fin
            );
            
            RETURN QUERY
            SELECT * FROM dblink(nodo.nodo_database, query) AS t(
                id_cita INTEGER,
                fecha_hora TIMESTAMP,
                paciente_nombre VARCHAR,
                empleado_nombre VARCHAR,
                tipo_servicio VARCHAR,
                estado VARCHAR,
                sede_nombre VARCHAR,
                nodo_origen VARCHAR
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error querying node %: %', nodo.nombre, SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get equipment inventory across all nodes
CREATE OR REPLACE FUNCTION inventario_equipamiento_federado()
RETURNS TABLE(
    id_equipamiento INTEGER,
    nombre VARCHAR,
    codigo VARCHAR,
    marca VARCHAR,
    modelo VARCHAR,
    departamento_nombre VARCHAR,
    sede_nombre VARCHAR,
    estado VARCHAR,
    nodo_origen VARCHAR
) AS $$
DECLARE
    nodo RECORD;
    query TEXT;
BEGIN
    -- Return local results first
    RETURN QUERY
    SELECT 
        eq.id_equipamiento,
        eq.nombre,
        eq.codigo,
        eq.marca,
        eq.modelo,
        d.nombre AS departamento_nombre,
        s.nombre AS sede_nombre,
        est.nombre AS estado,
        'LOCAL'::VARCHAR AS nodo_origen
    FROM equipamiento eq
    LEFT JOIN departamento d ON eq.id_departamento = d.id_departamento
    LEFT JOIN sede s ON eq.id_sede = s.id_sede
    LEFT JOIN estado est ON eq.id_estado = est.id_estado
    WHERE eq.activo = TRUE;

    -- Query remote nodes if dblink is available
    FOR nodo IN SELECT * FROM get_remote_nodes() LOOP
        BEGIN
            query := format(
                'SELECT eq.id_equipamiento, eq.nombre, eq.codigo, eq.marca, eq.modelo,
                        d.nombre, s.nombre, est.nombre, %L
                 FROM equipamiento eq
                 LEFT JOIN departamento d ON eq.id_departamento = d.id_departamento
                 LEFT JOIN sede s ON eq.id_sede = s.id_sede
                 LEFT JOIN estado est ON eq.id_estado = est.id_estado
                 WHERE eq.activo = TRUE',
                nodo.nombre
            );
            
            RETURN QUERY
            SELECT * FROM dblink(nodo.nodo_database, query) AS t(
                id_equipamiento INTEGER,
                nombre VARCHAR,
                codigo VARCHAR,
                marca VARCHAR,
                modelo VARCHAR,
                departamento_nombre VARCHAR,
                sede_nombre VARCHAR,
                estado VARCHAR,
                nodo_origen VARCHAR
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error querying node %: %', nodo.nombre, SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Statistics view: Patient count by node
CREATE OR REPLACE VIEW v_estadisticas_pacientes AS
SELECT 
    s.nombre AS sede_nombre,
    COUNT(p.id_paciente) AS total_pacientes,
    COUNT(CASE WHEN p.fecha_registro >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) AS pacientes_ultimo_mes
FROM sede s
LEFT JOIN paciente p ON s.id_sede = p.id_sede AND p.activo = TRUE
WHERE s.activo = TRUE
GROUP BY s.id_sede, s.nombre;

-- Statistics view: Appointment count by node
CREATE OR REPLACE VIEW v_estadisticas_citas AS
SELECT 
    s.nombre AS sede_nombre,
    COUNT(c.id_cita) AS total_citas,
    COUNT(CASE WHEN c.fecha_hora >= CURRENT_DATE THEN 1 END) AS citas_futuras,
    COUNT(CASE WHEN c.fecha_hora < CURRENT_DATE THEN 1 END) AS citas_pasadas
FROM sede s
LEFT JOIN cita c ON s.id_sede = c.id_sede
WHERE s.activo = TRUE
GROUP BY s.id_sede, s.nombre;
