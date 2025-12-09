const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Get all medications
router.get('/', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                id_medicamento,
                nombre,
                nombre_generico,
                descripcion,
                presentacion,
                concentracion,
                laboratorio,
                fecha_registro
            FROM medicamento
            WHERE activo = TRUE
            ORDER BY nombre
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching medications:', error);
        res.status(500).json({ error: 'Error fetching medications' });
    }
});

// Get medication by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT 
                id_medicamento,
                nombre,
                nombre_generico,
                descripcion,
                presentacion,
                concentracion,
                laboratorio,
                fecha_registro
            FROM medicamento
            WHERE id_medicamento = $1 AND activo = TRUE
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Medication not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching medication:', error);
        res.status(500).json({ error: 'Error fetching medication' });
    }
});

// Search medications
router.get('/search/:term', async (req, res) => {
    try {
        const { term } = req.params;
        const result = await query(`
            SELECT 
                id_medicamento,
                nombre,
                nombre_generico,
                presentacion,
                concentracion,
                laboratorio
            FROM medicamento
            WHERE activo = TRUE 
              AND (nombre ILIKE $1 OR nombre_generico ILIKE $1)
            ORDER BY nombre
            LIMIT 20
        `, [`%${term}%`]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error searching medications:', error);
        res.status(500).json({ error: 'Error searching medications' });
    }
});

// Create new medication
router.post('/', async (req, res) => {
    try {
        const {
            nombre, nombre_generico, descripcion, presentacion,
            concentracion, laboratorio
        } = req.body;
        
        const result = await query(`
            INSERT INTO medicamento (nombre, nombre_generico, descripcion,
                                    presentacion, concentracion, laboratorio)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id_medicamento
        `, [nombre, nombre_generico, descripcion, presentacion, concentracion, laboratorio]);
        
        res.status(201).json({
            message: 'Medication created successfully',
            id_medicamento: result.rows[0].id_medicamento
        });
    } catch (error) {
        console.error('Error creating medication:', error);
        res.status(500).json({ error: 'Error creating medication', details: error.message });
    }
});

module.exports = router;
