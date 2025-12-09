# API Examples and Testing Guide

This document provides examples for testing the Hospital Management System API endpoints.

## Prerequisites

- Backend server running on `http://localhost:3000`
- Database initialized with schema and seed data
- Tools: `curl`, Postman, or any HTTP client

## Base URL

```
http://localhost:3000/api
```

## 1. Health Check

### Check API Status

```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "ok",
  "message": "Hospital Management System API"
}
```

## 2. Patient Endpoints

### Get All Patients

```bash
curl http://localhost:3000/api/pacientes
```

### Get Patient by ID

```bash
curl http://localhost:3000/api/pacientes/1
```

### Search Patient by Document Number

```bash
curl http://localhost:3000/api/pacientes/search/documento/12345678
```

### Create New Patient

```bash
curl -X POST http://localhost:3000/api/pacientes \
  -H "Content-Type: application/json" \
  -d '{
    "nombres": "Carlos",
    "apellidos": "Rodríguez Silva",
    "id_tipodocumento": 1,
    "numero_documento": "45678901",
    "id_genero": 1,
    "fecha_nacimiento": "1990-08-20",
    "telefono": "987654321",
    "email": "carlos.rodriguez@email.com",
    "direccion": "Calle Lima 789",
    "numero_historia": "H-002",
    "grupo_sanguineo": "A+",
    "alergias": "Penicilina",
    "enfermedades_cronicas": "Ninguna",
    "contacto_emergencia": "Ana Rodríguez",
    "telefono_emergencia": "912345678",
    "id_sede": 1
  }'
```

### Update Patient

```bash
curl -X PUT http://localhost:3000/api/pacientes/1 \
  -H "Content-Type: application/json" \
  -d '{
    "nombres": "Carlos Alberto",
    "apellidos": "Rodríguez Silva",
    "telefono": "987654322",
    "email": "carlos.rodriguez.updated@email.com",
    "direccion": "Calle Lima 789 Dpto 101",
    "grupo_sanguineo": "A+",
    "alergias": "Penicilina, Polen",
    "enfermedades_cronicas": "Ninguna",
    "contacto_emergencia": "Ana Rodríguez",
    "telefono_emergencia": "912345678"
  }'
```

### Delete Patient (Soft Delete)

```bash
curl -X DELETE http://localhost:3000/api/pacientes/1
```

## 3. Appointment Endpoints

### Get All Appointments

```bash
curl http://localhost:3000/api/citas
```

### Get Appointment by ID

```bash
curl http://localhost:3000/api/citas/1
```

### Get Appointments by Patient ID

```bash
curl http://localhost:3000/api/citas/paciente/1
```

### Get Appointments by Date Range

```bash
curl "http://localhost:3000/api/citas/fecha/2024-01-01/2024-12-31"
```

### Create New Appointment

```bash
curl -X POST http://localhost:3000/api/citas \
  -H "Content-Type: application/json" \
  -d '{
    "id_paciente": 1,
    "id_empleado": 1,
    "id_tipo_servicio": 1,
    "fecha_hora": "2024-12-20T10:00:00",
    "duracion": 30,
    "motivo": "Consulta general de rutina",
    "observaciones": "Primera consulta del año",
    "id_estado": 1,
    "id_sede": 1
  }'
```

### Update Appointment

```bash
curl -X PUT http://localhost:3000/api/citas/1 \
  -H "Content-Type: application/json" \
  -d '{
    "fecha_hora": "2024-12-20T11:00:00",
    "duracion": 45,
    "motivo": "Consulta general de rutina - Actualizada",
    "observaciones": "Paciente solicitó cambio de horario",
    "id_estado": 2
  }'
```

### Cancel Appointment

```bash
curl -X DELETE http://localhost:3000/api/citas/1
```

## 4. Employee Endpoints

### Get All Employees

```bash
curl http://localhost:3000/api/empleados
```

### Get Employee by ID

```bash
curl http://localhost:3000/api/empleados/1
```

### Get All Doctors

```bash
curl http://localhost:3000/api/empleados/tipo/medicos
```

## 5. Medical Records Endpoints

### Get Medical Records by Patient ID

```bash
curl http://localhost:3000/api/historial-clinica/paciente/1
```

### Get Medical Record Details by ID

```bash
curl http://localhost:3000/api/historial-clinica/1
```

### Create New Medical Record

```bash
curl -X POST http://localhost:3000/api/historial-clinica \
  -H "Content-Type: application/json" \
  -d '{
    "id_paciente": 1,
    "id_empleado": 1,
    "id_cita": 1,
    "motivo_consulta": "Control de presión arterial",
    "sintomas": "Dolor de cabeza ocasional, mareos",
    "diagnostico": "Hipertensión arterial leve",
    "tratamiento": "Dieta baja en sal, ejercicio regular, medicación antihipertensiva",
    "observaciones": "Control en 30 días",
    "id_sede": 1,
    "prescripciones": [
      {
        "id_medicamento": 1,
        "dosis": "10mg",
        "frecuencia": "Una vez al día",
        "duracion": "30 días",
        "instrucciones": "Tomar en la mañana con el desayuno",
        "fecha_inicio": "2024-12-10",
        "fecha_fin": "2025-01-10"
      }
    ]
  }'
```

### Update Medical Record

```bash
curl -X PUT http://localhost:3000/api/historial-clinica/1 \
  -H "Content-Type: application/json" \
  -d '{
    "motivo_consulta": "Control de presión arterial - Seguimiento",
    "sintomas": "Dolor de cabeza ocasional",
    "diagnostico": "Hipertensión arterial controlada",
    "tratamiento": "Continuar con medicación actual",
    "observaciones": "Presión arterial dentro de rangos normales"
  }'
```

## 6. Medication Endpoints

### Get All Medications

```bash
curl http://localhost:3000/api/medicamentos
```

### Get Medication by ID

```bash
curl http://localhost:3000/api/medicamentos/1
```

### Search Medications

```bash
curl http://localhost:3000/api/medicamentos/search/paracetamol
```

### Create New Medication

```bash
curl -X POST http://localhost:3000/api/medicamentos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Ibuprofeno 400mg",
    "nombre_generico": "Ibuprofeno",
    "descripcion": "Antiinflamatorio no esteroideo",
    "presentacion": "Tableta",
    "concentracion": "400mg",
    "laboratorio": "Bayer"
  }'
```

## 7. Federated Query Endpoints

### Search Patient Across All Nodes

```bash
curl http://localhost:3000/api/federated/paciente/buscar/12345678
```

**Response Example:**
```json
[
  {
    "id_paciente": 1,
    "numero_historia": "H-001",
    "nombres": "Juan",
    "apellidos": "Pérez García",
    "numero_documento": "12345678",
    "grupo_sanguineo": "O+",
    "sede_nombre": "Hospital Central Lima",
    "nodo_origen": "LOCAL"
  }
]
```

### Get Complete Medical History Across Nodes

```bash
curl http://localhost:3000/api/federated/historial/H-001
```

**Response Example:**
```json
[
  {
    "id_historial": 1,
    "fecha_atencion": "2024-12-10T10:00:00.000Z",
    "medico_nombre": "María García López",
    "motivo_consulta": "Control de presión arterial",
    "diagnostico": "Hipertensión arterial leve",
    "tratamiento": "Dieta baja en sal, ejercicio regular",
    "sede_nombre": "Hospital Central Lima",
    "nodo_origen": "LOCAL"
  }
]
```

### Get Appointments by Date Range Across All Nodes

```bash
curl "http://localhost:3000/api/federated/citas/2024-01-01T00:00:00/2024-12-31T23:59:59"
```

### Get Equipment Inventory Across All Nodes

```bash
curl http://localhost:3000/api/federated/equipamiento/inventario
```

### Get All Patients from Federated View

```bash
curl http://localhost:3000/api/federated/pacientes/todos
```

### Get All Appointments from Federated View

```bash
curl http://localhost:3000/api/federated/citas/todas
```

### Get All Employees from Federated View

```bash
curl http://localhost:3000/api/federated/empleados/todos
```

### Get Statistics Summary

```bash
curl http://localhost:3000/api/federated/estadisticas/resumen
```

**Response Example:**
```json
{
  "pacientes": [
    {
      "sede_nombre": "Hospital Central Lima",
      "total_pacientes": "150",
      "pacientes_ultimo_mes": "25"
    }
  ],
  "citas": [
    {
      "sede_nombre": "Hospital Central Lima",
      "total_citas": "450",
      "citas_futuras": "120",
      "citas_pasadas": "330"
    }
  ]
}
```

## Testing with Postman

### Import as Collection

Create a new Postman collection with the following structure:

```json
{
  "info": {
    "name": "Hospital Management System API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/health"
      }
    },
    {
      "name": "Get All Patients",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/pacientes"
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000/api"
    }
  ]
}
```

## Error Handling

### Common Error Responses

**404 Not Found:**
```json
{
  "error": "Patient not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Error fetching patients",
  "details": "connection timeout"
}
```

**400 Bad Request:**
```json
{
  "error": "Invalid input data",
  "details": "numero_documento is required"
}
```

## Testing Federated Queries with Multiple Nodes

### Prerequisites for Multi-Node Testing

1. Set up multiple PostgreSQL instances
2. Configure dblink connections
3. Register remote nodes in the `sede` table

### Example: Testing Cross-Node Patient Search

**Step 1: Insert patient in Node 1**
```bash
curl -X POST http://localhost:3000/api/pacientes \
  -H "Content-Type: application/json" \
  -d '{
    "nombres": "Pedro",
    "apellidos": "González",
    "numero_documento": "11111111",
    "numero_historia": "H-N1-001",
    ...
    "id_sede": 1
  }'
```

**Step 2: Insert patient in Node 2 (if available)**
```sql
-- Directly in Node 2 database
INSERT INTO persona (...) VALUES (...);
INSERT INTO paciente (...) VALUES (...);
```

**Step 3: Search across all nodes**
```bash
curl http://localhost:3000/api/federated/paciente/buscar/11111111
```

**Expected Response:**
```json
[
  {
    "numero_documento": "11111111",
    "nombres": "Pedro",
    "apellidos": "González",
    "sede_nombre": "Hospital Central Lima",
    "nodo_origen": "LOCAL"
  },
  {
    "numero_documento": "11111111",
    "nombres": "Pedro",
    "apellidos": "González",
    "sede_nombre": "Hospital Regional Arequipa",
    "nodo_origen": "Hospital Regional Arequipa"
  }
]
```

## Performance Testing

### Load Testing with Apache Bench

```bash
# Test patient list endpoint
ab -n 1000 -c 10 http://localhost:3000/api/pacientes

# Test federated search
ab -n 100 -c 5 http://localhost:3000/api/federated/pacientes/todos
```

### Monitoring Query Performance

```bash
# Enable query logging in PostgreSQL
# Then check logs for slow queries
tail -f /var/log/postgresql/postgresql-16-main.log | grep "duration:"
```

## Best Practices

1. **Always validate input data** before sending to API
2. **Use proper date formats**: ISO 8601 (YYYY-MM-DDTHH:mm:ss)
3. **Handle errors gracefully** in your application
4. **Use pagination** for large datasets
5. **Cache frequently accessed data** when possible
6. **Monitor federated query performance** as they can be slower
7. **Test with realistic data volumes** before production
8. **Use connection pooling** for better performance
9. **Implement retry logic** for network failures
10. **Log all API requests** for debugging and auditing

## Troubleshooting

### API Not Responding

```bash
# Check if server is running
curl http://localhost:3000/api/health

# Check server logs
cd backend
npm start
```

### Database Connection Issues

```bash
# Test database connection
psql -U postgres -d hospital_db -c "SELECT 1"

# Check database configuration in .env file
cat backend/.env
```

### Federated Queries Not Working

```sql
-- Check if dblink extension is installed
SELECT * FROM pg_extension WHERE extname = 'dblink';

-- Test dblink connection
SELECT dblink_connect('test', 'host=localhost dbname=hospital_db');
SELECT * FROM dblink('test', 'SELECT 1') AS t(result int);
SELECT dblink_disconnect('test');
```

### CORS Issues

If you get CORS errors from the frontend:
1. Check `CORS_ORIGIN` in backend `.env`
2. Ensure it matches your frontend URL
3. Restart the backend server after changes

## Additional Resources

- [PostgreSQL dblink Documentation](https://www.postgresql.org/docs/current/dblink.html)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Axios Documentation](https://axios-http.com/)
