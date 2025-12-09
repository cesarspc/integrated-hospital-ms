const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Get medical records by patient ID
router.get('/paciente/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT 
                h.id_historial,
                h.fecha_atencion,
                h.motivo_consulta,
                h.sintomas,
                h.diagnostico,
                h.tratamiento,
                h.observaciones,
                per_emp.nombres || ' ' || per_emp.apellidos AS medico_nombre,
                e.especialidad,
                s.nombre AS sede_nombre,
                c.fecha_hora AS fecha_cita
            FROM historialclinica h
            INNER JOIN empleado e ON h.id_empleado = e.id_empleado
            INNER JOIN persona per_emp ON e.id_persona = per_emp.id_persona
            LEFT JOIN sede s ON h.id_sede = s.id_sede
            LEFT JOIN cita c ON h.id_cita = c.id_cita
            WHERE h.id_paciente = $1
            ORDER BY h.fecha_atencion DESC
        `, [id]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching medical records:', error);
        res.status(500).json({ error: 'Error fetching medical records' });
    }
});

// Get medical record by ID with prescriptions
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get medical record
        const historialResult = await query(`
            SELECT 
                h.id_historial,
                h.id_paciente,
                h.fecha_atencion,
                h.motivo_consulta,
                h.sintomas,
                h.diagnostico,
                h.tratamiento,
                h.observaciones,
                per_pac.nombres || ' ' || per_pac.apellidos AS paciente_nombre,
                p.numero_historia,
                per_emp.nombres || ' ' || per_emp.apellidos AS medico_nombre,
                e.especialidad,
                s.nombre AS sede_nombre
            FROM historialclinica h
            INNER JOIN paciente p ON h.id_paciente = p.id_paciente
            INNER JOIN persona per_pac ON p.id_persona = per_pac.id_persona
            INNER JOIN empleado e ON h.id_empleado = e.id_empleado
            INNER JOIN persona per_emp ON e.id_persona = per_emp.id_persona
            LEFT JOIN sede s ON h.id_sede = s.id_sede
            WHERE h.id_historial = $1
        `, [id]);
        
        if (historialResult.rows.length === 0) {
            return res.status(404).json({ error: 'Medical record not found' });
        }
        
        // Get prescriptions for this medical record
        const prescripcionesResult = await query(`
            SELECT 
                pr.id_prescripcion,
                m.nombre AS medicamento,
                m.nombre_generico,
                m.presentacion,
                pr.dosis,
                pr.frecuencia,
                pr.duracion,
                pr.instrucciones,
                pr.fecha_inicio,
                pr.fecha_fin
            FROM prescripcion pr
            INNER JOIN medicamento m ON pr.id_medicamento = m.id_medicamento
            WHERE pr.id_historial = $1 AND pr.activo = TRUE
            ORDER BY pr.fecha_prescripcion DESC
        `, [id]);
        
        // Get medical reports
        const reportesResult = await query(`
            SELECT 
                r.id_reporte,
                r.titulo,
                r.contenido,
                r.resultados,
                r.conclusiones,
                r.fecha_reporte,
                tr.nombre AS tipo_reporte,
                r.archivo_adjunto
            FROM reportemedico r
            LEFT JOIN tiporeporte tr ON r.id_tiporeporte = tr.id_tiporeporte
            WHERE r.id_historial = $1 AND r.activo = TRUE
            ORDER BY r.fecha_reporte DESC
        `, [id]);
        
        const record = historialResult.rows[0];
        record.prescripciones = prescripcionesResult.rows;
        record.reportes = reportesResult.rows;
        
        res.json(record);
    } catch (error) {
        console.error('Error fetching medical record:', error);
        res.status(500).json({ error: 'Error fetching medical record' });
    }
});

// Create new medical record
router.post('/', async (req, res) => {
    const client = await query('SELECT 1').then(() => require('../config/database').pool.connect());
    
    try {
        await client.query('BEGIN');
        
        const {
            id_paciente, id_empleado, id_cita, motivo_consulta,
            sintomas, diagnostico, tratamiento, observaciones, id_sede,
            prescripciones
        } = req.body;
        
        // Insert medical record
        const historialResult = await client.query(`
            INSERT INTO historialclinica (id_paciente, id_empleado, id_cita, motivo_consulta,
                                         sintomas, diagnostico, tratamiento, observaciones, id_sede)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id_historial
        `, [id_paciente, id_empleado, id_cita, motivo_consulta,
            sintomas, diagnostico, tratamiento, observaciones, id_sede]);
        
        const id_historial = historialResult.rows[0].id_historial;
        
        // Insert prescriptions if provided
        if (prescripciones && prescripciones.length > 0) {
            for (const prescripcion of prescripciones) {
                await client.query(`
                    INSERT INTO prescripcion (id_historial, id_medicamento, dosis, frecuencia,
                                            duracion, instrucciones, fecha_inicio, fecha_fin)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [id_historial, prescripcion.id_medicamento, prescripcion.dosis,
                    prescripcion.frecuencia, prescripcion.duracion, prescripcion.instrucciones,
                    prescripcion.fecha_inicio, prescripcion.fecha_fin]);
            }
        }
        
        await client.query('COMMIT');
        
        res.status(201).json({
            message: 'Medical record created successfully',
            id_historial
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating medical record:', error);
        res.status(500).json({ error: 'Error creating medical record', details: error.message });
    } finally {
        client.release();
    }
});

// Update medical record
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            motivo_consulta, sintomas, diagnostico, tratamiento, observaciones
        } = req.body;
        
        await query(`
            UPDATE historialclinica 
            SET motivo_consulta = $1, sintomas = $2, diagnostico = $3,
                tratamiento = $4, observaciones = $5
            WHERE id_historial = $6
        `, [motivo_consulta, sintomas, diagnostico, tratamiento, observaciones, id]);
        
        res.json({ message: 'Medical record updated successfully' });
    } catch (error) {
        console.error('Error updating medical record:', error);
        res.status(500).json({ error: 'Error updating medical record' });
    }
});

module.exports = router;
