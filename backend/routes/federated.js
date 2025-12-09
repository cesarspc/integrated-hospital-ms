const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Search patient across all nodes
router.get('/paciente/buscar/:numero_documento', async (req, res) => {
    try {
        const { numero_documento } = req.params;
        const result = await query(
            'SELECT * FROM buscar_paciente_federado($1)',
            [numero_documento]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Patient not found in any node' });
        }
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error searching patient across nodes:', error);
        res.status(500).json({ error: 'Error searching patient across nodes', details: error.message });
    }
});

// Get complete patient medical history across all nodes
router.get('/historial/:numero_historia', async (req, res) => {
    try {
        const { numero_historia } = req.params;
        const result = await query(
            'SELECT * FROM obtener_historial_completo_paciente($1)',
            [numero_historia]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching patient history across nodes:', error);
        res.status(500).json({ error: 'Error fetching patient history across nodes', details: error.message });
    }
});

// Get appointments by date range across all nodes
router.get('/citas/:fecha_inicio/:fecha_fin', async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.params;
        const result = await query(
            'SELECT * FROM obtener_citas_rango_fechas($1, $2)',
            [fecha_inicio, fecha_fin]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching appointments across nodes:', error);
        res.status(500).json({ error: 'Error fetching appointments across nodes', details: error.message });
    }
});

// Get equipment inventory across all nodes
router.get('/equipamiento/inventario', async (req, res) => {
    try {
        const result = await query('SELECT * FROM inventario_equipamiento_federado()');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching equipment inventory across nodes:', error);
        res.status(500).json({ error: 'Error fetching equipment inventory across nodes', details: error.message });
    }
});

// Get all patients from federated view
router.get('/pacientes/todos', async (req, res) => {
    try {
        const result = await query('SELECT * FROM v_pacientes_federados ORDER BY fecha_registro DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching federated patients:', error);
        res.status(500).json({ error: 'Error fetching federated patients', details: error.message });
    }
});

// Get all appointments from federated view
router.get('/citas/todas', async (req, res) => {
    try {
        const result = await query('SELECT * FROM v_citas_federadas ORDER BY fecha_hora DESC LIMIT 100');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching federated appointments:', error);
        res.status(500).json({ error: 'Error fetching federated appointments', details: error.message });
    }
});

// Get all employees from federated view
router.get('/empleados/todos', async (req, res) => {
    try {
        const result = await query('SELECT * FROM v_empleados_federados ORDER BY apellidos, nombres');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching federated employees:', error);
        res.status(500).json({ error: 'Error fetching federated employees', details: error.message });
    }
});

// Get statistics
router.get('/estadisticas/resumen', async (req, res) => {
    try {
        const pacientesStats = await query('SELECT * FROM v_estadisticas_pacientes');
        const citasStats = await query('SELECT * FROM v_estadisticas_citas');
        
        res.json({
            pacientes: pacientesStats.rows,
            citas: citasStats.rows
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ error: 'Error fetching statistics', details: error.message });
    }
});

module.exports = router;
