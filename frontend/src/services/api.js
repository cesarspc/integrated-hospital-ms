import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Patients API
export const pacienteAPI = {
    getAll: () => api.get('/pacientes'),
    getById: (id) => api.get(`/pacientes/${id}`),
    searchByDocumento: (numero) => api.get(`/pacientes/search/documento/${numero}`),
    create: (data) => api.post('/pacientes', data),
    update: (id, data) => api.put(`/pacientes/${id}`, data),
    delete: (id) => api.delete(`/pacientes/${id}`),
};

// Appointments API
export const citaAPI = {
    getAll: () => api.get('/citas'),
    getById: (id) => api.get(`/citas/${id}`),
    getByPaciente: (id) => api.get(`/citas/paciente/${id}`),
    getByDateRange: (inicio, fin) => api.get(`/citas/fecha/${inicio}/${fin}`),
    create: (data) => api.post('/citas', data),
    update: (id, data) => api.put(`/citas/${id}`, data),
    cancel: (id) => api.delete(`/citas/${id}`),
};

// Employees API
export const empleadoAPI = {
    getAll: () => api.get('/empleados'),
    getById: (id) => api.get(`/empleados/${id}`),
    getDoctors: () => api.get('/empleados/tipo/medicos'),
};

// Medical Records API
export const historialAPI = {
    getByPaciente: (id) => api.get(`/historial-clinica/paciente/${id}`),
    getById: (id) => api.get(`/historial-clinica/${id}`),
    create: (data) => api.post('/historial-clinica', data),
    update: (id, data) => api.put(`/historial-clinica/${id}`, data),
};

// Medications API
export const medicamentoAPI = {
    getAll: () => api.get('/medicamentos'),
    getById: (id) => api.get(`/medicamentos/${id}`),
    search: (term) => api.get(`/medicamentos/search/${term}`),
    create: (data) => api.post('/medicamentos', data),
};

// Federated Queries API
export const federatedAPI = {
    searchPaciente: (numeroDocumento) => api.get(`/federated/paciente/buscar/${numeroDocumento}`),
    getHistorialCompleto: (numeroHistoria) => api.get(`/federated/historial/${numeroHistoria}`),
    getCitasByDateRange: (inicio, fin) => api.get(`/federated/citas/${inicio}/${fin}`),
    getEquipamientoInventario: () => api.get('/federated/equipamiento/inventario'),
    getAllPacientes: () => api.get('/federated/pacientes/todos'),
    getAllCitas: () => api.get('/federated/citas/todas'),
    getAllEmpleados: () => api.get('/federated/empleados/todos'),
    getEstadisticas: () => api.get('/federated/estadisticas/resumen'),
};

export default api;
