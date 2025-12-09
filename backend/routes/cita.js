const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Get all appointments
router.get('/', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                c.id_cita,
                c.fecha_hora,
                c.duracion,
                c.motivo,
                c.observaciones,
                p.numero_historia,
                per_pac.nombres || ' ' || per_pac.apellidos AS paciente_nombre,
                e.numero_empleado,
                per_emp.nombres || ' ' || per_emp.apellidos AS empleado_nombre,
                e.especialidad,
                ts.nombre AS tipo_servicio,
                ts.costo_base,
                est.nombre AS estado,
                s.nombre AS sede_nombre,
                c.fecha_creacion
            FROM cita c
            INNER JOIN paciente p ON c.id_paciente = p.id_paciente
            INNER JOIN persona per_pac ON p.id_persona = per_pac.id_persona
            INNER JOIN empleado e ON c.id_empleado = e.id_empleado
            INNER JOIN persona per_emp ON e.id_persona = per_emp.id_persona
            LEFT JOIN tipo_servicio ts ON c.id_tipo_servicio = ts.id_tipo_servicio
            LEFT JOIN estado est ON c.id_estado = est.id_estado
            LEFT JOIN sede s ON c.id_sede = s.id_sede
            ORDER BY c.fecha_hora DESC
            LIMIT 100
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Error fetching appointments' });
    }
});

// Get appointment by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT 
                c.id_cita,
                c.id_paciente,
                c.id_empleado,
                c.id_tipo_servicio,
                c.fecha_hora,
                c.duracion,
                c.motivo,
                c.observaciones,
                c.id_estado,
                c.id_sede,
                p.numero_historia,
                per_pac.nombres || ' ' || per_pac.apellidos AS paciente_nombre,
                e.numero_empleado,
                per_emp.nombres || ' ' || per_emp.apellidos AS empleado_nombre,
                e.especialidad,
                ts.nombre AS tipo_servicio,
                est.nombre AS estado,
                s.nombre AS sede_nombre
            FROM cita c
            INNER JOIN paciente p ON c.id_paciente = p.id_paciente
            INNER JOIN persona per_pac ON p.id_persona = per_pac.id_persona
            INNER JOIN empleado e ON c.id_empleado = e.id_empleado
            INNER JOIN persona per_emp ON e.id_persona = per_emp.id_persona
            LEFT JOIN tipo_servicio ts ON c.id_tipo_servicio = ts.id_tipo_servicio
            LEFT JOIN estado est ON c.id_estado = est.id_estado
            LEFT JOIN sede s ON c.id_sede = s.id_sede
            WHERE c.id_cita = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching appointment:', error);
        res.status(500).json({ error: 'Error fetching appointment' });
    }
});

// Get appointments by patient ID
router.get('/paciente/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT 
                c.id_cita,
                c.fecha_hora,
                c.motivo,
                per_emp.nombres || ' ' || per_emp.apellidos AS empleado_nombre,
                e.especialidad,
                ts.nombre AS tipo_servicio,
                est.nombre AS estado,
                s.nombre AS sede_nombre
            FROM cita c
            INNER JOIN empleado e ON c.id_empleado = e.id_empleado
            INNER JOIN persona per_emp ON e.id_persona = per_emp.id_persona
            LEFT JOIN tipo_servicio ts ON c.id_tipo_servicio = ts.id_tipo_servicio
            LEFT JOIN estado est ON c.id_estado = est.id_estado
            LEFT JOIN sede s ON c.id_sede = s.id_sede
            WHERE c.id_paciente = $1
            ORDER BY c.fecha_hora DESC
        `, [id]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching patient appointments:', error);
        res.status(500).json({ error: 'Error fetching patient appointments' });
    }
});

// Get appointments by date range
router.get('/fecha/:inicio/:fin', async (req, res) => {
    try {
        const { inicio, fin } = req.params;
        const result = await query(`
            SELECT 
                c.id_cita,
                c.fecha_hora,
                c.duracion,
                c.motivo,
                per_pac.nombres || ' ' || per_pac.apellidos AS paciente_nombre,
                per_emp.nombres || ' ' || per_emp.apellidos AS empleado_nombre,
                ts.nombre AS tipo_servicio,
                est.nombre AS estado,
                s.nombre AS sede_nombre
            FROM cita c
            INNER JOIN paciente p ON c.id_paciente = p.id_paciente
            INNER JOIN persona per_pac ON p.id_persona = per_pac.id_persona
            INNER JOIN empleado e ON c.id_empleado = e.id_empleado
            INNER JOIN persona per_emp ON e.id_persona = per_emp.id_persona
            LEFT JOIN tipo_servicio ts ON c.id_tipo_servicio = ts.id_tipo_servicio
            LEFT JOIN estado est ON c.id_estado = est.id_estado
            LEFT JOIN sede s ON c.id_sede = s.id_sede
            WHERE c.fecha_hora BETWEEN $1 AND $2
            ORDER BY c.fecha_hora
        `, [inicio, fin]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching appointments by date:', error);
        res.status(500).json({ error: 'Error fetching appointments by date' });
    }
});

// Create new appointment
router.post('/', async (req, res) => {
    try {
        const {
            id_paciente, id_empleado, id_tipo_servicio, fecha_hora,
            duracion, motivo, observaciones, id_estado, id_sede
        } = req.body;
        
        const result = await query(`
            INSERT INTO cita (id_paciente, id_empleado, id_tipo_servicio, fecha_hora,
                             duracion, motivo, observaciones, id_estado, id_sede)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id_cita
        `, [id_paciente, id_empleado, id_tipo_servicio, fecha_hora,
            duracion, motivo, observaciones, id_estado, id_sede]);
        
        res.status(201).json({
            message: 'Appointment created successfully',
            id_cita: result.rows[0].id_cita
        });
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ error: 'Error creating appointment', details: error.message });
    }
});

// Update appointment
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            fecha_hora, duracion, motivo, observaciones, id_estado
        } = req.body;
        
        await query(`
            UPDATE cita 
            SET fecha_hora = $1, duracion = $2, motivo = $3,
                observaciones = $4, id_estado = $5, fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id_cita = $6
        `, [fecha_hora, duracion, motivo, observaciones, id_estado, id]);
        
        res.json({ message: 'Appointment updated successfully' });
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ error: 'Error updating appointment' });
    }
});

// Cancel appointment
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Get "Cancelado" state ID
        const estadoResult = await query(
            "SELECT id_estado FROM estado WHERE nombre = 'Cancelado'",
            []
        );
        
        if (estadoResult.rows.length > 0) {
            await query(
                'UPDATE cita SET id_estado = $1 WHERE id_cita = $2',
                [estadoResult.rows[0].id_estado, id]
            );
        }
        
        res.json({ message: 'Appointment cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({ error: 'Error cancelling appointment' });
    }
});

module.exports = router;
