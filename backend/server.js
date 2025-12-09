const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Import routes
const pacienteRoutes = require('./routes/paciente');
const citaRoutes = require('./routes/cita');
const empleadoRoutes = require('./routes/empleado');
const historialRoutes = require('./routes/historialclinica');
const medicamentoRoutes = require('./routes/medicamento');
const federatedRoutes = require('./routes/federated');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Hospital Management System API' });
});

// API routes
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/historial-clinica', historialRoutes);
app.use('/api/medicamentos', medicamentoRoutes);
app.use('/api/federated', federatedRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await testConnection();
});

module.exports = app;
