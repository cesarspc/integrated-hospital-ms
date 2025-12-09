const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Get all employees
router.get('/', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                e.id_empleado,
                e.numero_empleado,
                per.nombres,
                per.apellidos,
                per.numero_documento,
                per.email,
                per.telefono,
                c.nombre AS cargo,
                d.nombre AS departamento,
                r.nombre AS rol,
                e.especialidad,
                e.licencia_medica,
                e.fecha_contratacion,
                s.nombre AS sede_nombre
            FROM empleado e
            INNER JOIN persona per ON e.id_persona = per.id_persona
            LEFT JOIN cargo c ON e.id_cargo = c.id_cargo
            LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
            LEFT JOIN rol r ON e.id_rol = r.id_rol
            LEFT JOIN sede s ON d.id_sede = s.id_sede
            WHERE e.activo = TRUE
            ORDER BY per.apellidos, per.nombres
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Error fetching employees' });
    }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT 
                e.id_empleado,
                e.numero_empleado,
                per.nombres,
                per.apellidos,
                per.numero_documento,
                per.email,
                per.telefono,
                per.direccion,
                per.fecha_nacimiento,
                c.nombre AS cargo,
                d.nombre AS departamento,
                r.nombre AS rol,
                e.especialidad,
                e.licencia_medica,
                e.fecha_contratacion,
                s.nombre AS sede_nombre
            FROM empleado e
            INNER JOIN persona per ON e.id_persona = per.id_persona
            LEFT JOIN cargo c ON e.id_cargo = c.id_cargo
            LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
            LEFT JOIN rol r ON e.id_rol = r.id_rol
            LEFT JOIN sede s ON d.id_sede = s.id_sede
            WHERE e.id_empleado = $1 AND e.activo = TRUE
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ error: 'Error fetching employee' });
    }
});

// Get doctors (employees with medical specialty)
router.get('/tipo/medicos', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                e.id_empleado,
                e.numero_empleado,
                per.nombres || ' ' || per.apellidos AS nombre_completo,
                e.especialidad,
                e.licencia_medica,
                d.nombre AS departamento,
                s.nombre AS sede_nombre
            FROM empleado e
            INNER JOIN persona per ON e.id_persona = per.id_persona
            LEFT JOIN departamento d ON e.id_departamento = d.id_departamento
            LEFT JOIN sede s ON d.id_sede = s.id_sede
            WHERE e.activo = TRUE AND e.especialidad IS NOT NULL
            ORDER BY per.apellidos, per.nombres
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ error: 'Error fetching doctors' });
    }
});

module.exports = router;
