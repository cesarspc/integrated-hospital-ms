const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { writeOperationLimiter } = require('../middleware/rateLimiter');

// Get all patients
router.get('/', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                p.id_paciente,
                p.numero_historia,
                per.nombres,
                per.apellidos,
                per.numero_documento,
                per.fecha_nacimiento,
                per.telefono,
                per.email,
                p.grupo_sanguineo,
                p.alergias,
                p.enfermedades_cronicas,
                p.contacto_emergencia,
                p.telefono_emergencia,
                g.nombre AS genero,
                s.nombre AS sede,
                p.fecha_registro
            FROM paciente p
            INNER JOIN persona per ON p.id_persona = per.id_persona
            LEFT JOIN genero g ON per.id_genero = g.id_genero
            LEFT JOIN sede s ON p.id_sede = s.id_sede
            WHERE p.activo = TRUE
            ORDER BY p.fecha_registro DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ error: 'Error fetching patients' });
    }
});

// Get patient by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT 
                p.id_paciente,
                p.numero_historia,
                per.nombres,
                per.apellidos,
                per.numero_documento,
                per.fecha_nacimiento,
                per.telefono,
                per.email,
                per.direccion,
                p.grupo_sanguineo,
                p.alergias,
                p.enfermedades_cronicas,
                p.contacto_emergencia,
                p.telefono_emergencia,
                g.nombre AS genero,
                s.nombre AS sede,
                p.fecha_registro
            FROM paciente p
            INNER JOIN persona per ON p.id_persona = per.id_persona
            LEFT JOIN genero g ON per.id_genero = g.id_genero
            LEFT JOIN sede s ON p.id_sede = s.id_sede
            WHERE p.id_paciente = $1 AND p.activo = TRUE
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching patient:', error);
        res.status(500).json({ error: 'Error fetching patient' });
    }
});

// Search patient by document number
router.get('/search/documento/:numero', async (req, res) => {
    try {
        const { numero } = req.params;
        const result = await query(`
            SELECT 
                p.id_paciente,
                p.numero_historia,
                per.nombres,
                per.apellidos,
                per.numero_documento,
                per.fecha_nacimiento,
                per.telefono,
                per.email,
                p.grupo_sanguineo,
                s.nombre AS sede
            FROM paciente p
            INNER JOIN persona per ON p.id_persona = per.id_persona
            LEFT JOIN sede s ON p.id_sede = s.id_sede
            WHERE per.numero_documento = $1 AND p.activo = TRUE
        `, [numero]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error searching patient:', error);
        res.status(500).json({ error: 'Error searching patient' });
    }
});

// Create new patient
router.post('/', writeOperationLimiter, async (req, res) => {
    const client = await query('SELECT 1').then(() => require('../config/database').pool.connect());
    
    try {
        await client.query('BEGIN');
        
        const {
            nombres, apellidos, id_tipodocumento, numero_documento,
            id_genero, fecha_nacimiento, telefono, email, direccion,
            numero_historia, grupo_sanguineo, alergias, enfermedades_cronicas,
            contacto_emergencia, telefono_emergencia, id_sede
        } = req.body;
        
        // Insert persona
        const personaResult = await client.query(`
            INSERT INTO persona (nombres, apellidos, id_tipodocumento, numero_documento,
                                id_genero, fecha_nacimiento, telefono, email, direccion)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id_persona
        `, [nombres, apellidos, id_tipodocumento, numero_documento, id_genero,
            fecha_nacimiento, telefono, email, direccion]);
        
        const id_persona = personaResult.rows[0].id_persona;
        
        // Insert paciente
        const pacienteResult = await client.query(`
            INSERT INTO paciente (id_persona, numero_historia, grupo_sanguineo,
                                 alergias, enfermedades_cronicas, contacto_emergencia,
                                 telefono_emergencia, id_sede)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id_paciente
        `, [id_persona, numero_historia, grupo_sanguineo, alergias,
            enfermedades_cronicas, contacto_emergencia, telefono_emergencia, id_sede]);
        
        await client.query('COMMIT');
        
        res.status(201).json({
            message: 'Patient created successfully',
            id_paciente: pacienteResult.rows[0].id_paciente,
            id_persona
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating patient:', error);
        res.status(500).json({ error: 'Error creating patient', details: error.message });
    } finally {
        client.release();
    }
});

// Update patient
router.put('/:id', writeOperationLimiter, async (req, res) => {
    const client = await query('SELECT 1').then(() => require('../config/database').pool.connect());
    
    try {
        await client.query('BEGIN');
        
        const { id } = req.params;
        const {
            nombres, apellidos, telefono, email, direccion,
            grupo_sanguineo, alergias, enfermedades_cronicas,
            contacto_emergencia, telefono_emergencia
        } = req.body;
        
        // Get id_persona
        const pacienteResult = await client.query(
            'SELECT id_persona FROM paciente WHERE id_paciente = $1',
            [id]
        );
        
        if (pacienteResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Patient not found' });
        }
        
        const id_persona = pacienteResult.rows[0].id_persona;
        
        // Update persona
        await client.query(`
            UPDATE persona 
            SET nombres = $1, apellidos = $2, telefono = $3, email = $4, direccion = $5
            WHERE id_persona = $6
        `, [nombres, apellidos, telefono, email, direccion, id_persona]);
        
        // Update paciente
        await client.query(`
            UPDATE paciente 
            SET grupo_sanguineo = $1, alergias = $2, enfermedades_cronicas = $3,
                contacto_emergencia = $4, telefono_emergencia = $5
            WHERE id_paciente = $6
        `, [grupo_sanguineo, alergias, enfermedades_cronicas,
            contacto_emergencia, telefono_emergencia, id]);
        
        await client.query('COMMIT');
        
        res.json({ message: 'Patient updated successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating patient:', error);
        res.status(500).json({ error: 'Error updating patient' });
    } finally {
        client.release();
    }
});

// Delete patient (soft delete)
router.delete('/:id', writeOperationLimiter, async (req, res) => {
    try {
        const { id } = req.params;
        await query('UPDATE paciente SET activo = FALSE WHERE id_paciente = $1', [id]);
        res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
        console.error('Error deleting patient:', error);
        res.status(500).json({ error: 'Error deleting patient' });
    }
});

module.exports = router;
