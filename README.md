# Integrated Hospital Management System

A comprehensive distributed hospital management system with PostgreSQL databases across multiple nodes, supporting federated queries using dblink.

## Features

### Backend (Node.js/Express + PostgreSQL)
- **Unified Database Schema**: All nodes share the same schema with 21 core tables (Spanish naming)
- **Distributed Architecture**: Support for multiple database nodes (one per health center)
- **Federated Queries**: Uses PostgreSQL dblink for cross-node data querying
- **RESTful API**: Complete CRUD operations for all entities
- **Interoperability**: Federated views and functions for seamless multi-node queries

### Frontend (React)
- **Patient Management**: Complete patient registration and information management
- **Appointment Scheduling**: Create and manage patient appointments
- **Medical Records**: Access and manage patient clinical history
- **Employee Management**: Manage medical staff and administrative personnel
- **Federated Search**: Search patients and medical records across all nodes
- **Dashboard**: Statistics and overview of the distributed system

## Database Schema

### Core Tables (Spanish Naming)
1. **auditoriaacceso** - Access audit logs
2. **cargo** - Job positions
3. **cita** - Medical appointments
4. **departamento** - Departments
5. **empleado** - Employees/Medical staff
6. **equipamiento** - Medical equipment
7. **estado** - Status/States
8. **genero** - Gender
9. **historialclinica** - Medical records
10. **medicamento** - Medications
11. **paciente** - Patients
12. **persona** - Persons (base entity)
13. **prescripcion** - Prescriptions
14. **provee** - Supplier relationships
15. **proveedor** - Suppliers
16. **reportemedico** - Medical reports
17. **rol** - User roles
18. **sede** - Health centers/locations
19. **tipo_servicio** - Service types
20. **tipodocumento** - Document types
21. **tiporeporte** - Report types

## Project Structure

```
integrated-hospital-ms/
├── backend/
│   ├── config/
│   │   └── database.js          # Database connection configuration
│   ├── database/
│   │   ├── schema.sql            # Database schema with all tables
│   │   └── federated_views.sql  # Federated views and functions
│   ├── routes/
│   │   ├── paciente.js          # Patient endpoints
│   │   ├── cita.js              # Appointment endpoints
│   │   ├── empleado.js          # Employee endpoints
│   │   ├── historialclinica.js  # Medical records endpoints
│   │   ├── medicamento.js       # Medication endpoints
│   │   └── federated.js         # Federated query endpoints
│   ├── server.js                 # Main server file
│   ├── package.json
│   └── .env.example             # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   ├── pages/               # Page components
│   │   │   ├── Dashboard.js
│   │   │   ├── PacientesList.js
│   │   │   ├── PacienteDetail.js
│   │   │   ├── CitasList.js
│   │   │   ├── EmpleadosList.js
│   │   │   └── FederatedSearch.js
│   │   ├── services/
│   │   │   └── api.js           # API service layer
│   │   ├── App.js
│   │   └── App.css
│   └── package.json
└── README.md
```

## Installation and Setup

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure your database connection in `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=hospital_db
PORT=3000
CORS_ORIGIN=http://localhost:3001
```

5. Create the database:
```bash
createdb hospital_db
```

6. Initialize the database schema:
```bash
psql -d hospital_db -f database/schema.sql
```

7. Create federated views and functions:
```bash
psql -d hospital_db -f database/federated_views.sql
```

8. Start the backend server:
```bash
npm start
```

The API will be available at `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional):
```env
REACT_APP_API_URL=http://localhost:3000/api
```

4. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3001`

## Distributed Setup (Multiple Nodes)

### Configuring Additional Database Nodes

1. Create additional PostgreSQL databases on different servers/instances
2. Apply the same schema to each node:
```bash
psql -h node2_host -d hospital_db_node2 -f database/schema.sql
psql -h node2_host -d hospital_db_node2 -f database/federated_views.sql
```

3. Configure dblink connections in each database:
```sql
-- On main node, register remote nodes
INSERT INTO sede (nombre, direccion, telefono, ciudad, pais, nodo_database, activo)
VALUES (
    'Hospital Central',
    'Av. Principal 123',
    '+51-1-1234567',
    'Lima',
    'Perú',
    'host=node2_host port=5432 dbname=hospital_db_node2 user=postgres password=secret',
    TRUE
);
```

4. Enable dblink extension (if not already enabled):
```sql
CREATE EXTENSION IF NOT EXISTS dblink;
```

### Testing Federated Queries

1. Search for a patient across all nodes:
```bash
curl http://localhost:3000/api/federated/paciente/buscar/12345678
```

2. Get complete medical history from all nodes:
```bash
curl http://localhost:3000/api/federated/historial/H-001
```

3. View federated statistics:
```bash
curl http://localhost:3000/api/federated/estadisticas/resumen
```

## API Documentation

### Patient Endpoints
- `GET /api/pacientes` - Get all patients
- `GET /api/pacientes/:id` - Get patient by ID
- `GET /api/pacientes/search/documento/:numero` - Search by document
- `POST /api/pacientes` - Create new patient
- `PUT /api/pacientes/:id` - Update patient
- `DELETE /api/pacientes/:id` - Delete patient (soft delete)

### Appointment Endpoints
- `GET /api/citas` - Get all appointments
- `GET /api/citas/:id` - Get appointment by ID
- `GET /api/citas/paciente/:id` - Get appointments by patient
- `GET /api/citas/fecha/:inicio/:fin` - Get appointments by date range
- `POST /api/citas` - Create new appointment
- `PUT /api/citas/:id` - Update appointment
- `DELETE /api/citas/:id` - Cancel appointment

### Employee Endpoints
- `GET /api/empleados` - Get all employees
- `GET /api/empleados/:id` - Get employee by ID
- `GET /api/empleados/tipo/medicos` - Get all doctors

### Medical Records Endpoints
- `GET /api/historial-clinica/paciente/:id` - Get medical records by patient
- `GET /api/historial-clinica/:id` - Get medical record details with prescriptions
- `POST /api/historial-clinica` - Create new medical record
- `PUT /api/historial-clinica/:id` - Update medical record

### Medication Endpoints
- `GET /api/medicamentos` - Get all medications
- `GET /api/medicamentos/:id` - Get medication by ID
- `GET /api/medicamentos/search/:term` - Search medications
- `POST /api/medicamentos` - Create new medication

### Federated Query Endpoints
- `GET /api/federated/paciente/buscar/:documento` - Search patient across all nodes
- `GET /api/federated/historial/:numero_historia` - Get complete medical history
- `GET /api/federated/citas/:inicio/:fin` - Get appointments across all nodes
- `GET /api/federated/equipamiento/inventario` - Get equipment inventory
- `GET /api/federated/pacientes/todos` - Get all patients from all nodes
- `GET /api/federated/citas/todas` - Get all appointments from all nodes
- `GET /api/federated/empleados/todos` - Get all employees from all nodes
- `GET /api/federated/estadisticas/resumen` - Get statistics summary

## Security Considerations

1. **Database Security**:
   - Use strong passwords for database connections
   - Configure PostgreSQL authentication properly (pg_hba.conf)
   - Enable SSL for remote connections
   - Use read-only credentials for federated queries when possible

2. **API Security** (to be implemented):
   - Add JWT authentication
   - Implement role-based access control (RBAC)
   - Use HTTPS in production
   - Add rate limiting
   - Implement input validation and sanitization

3. **Audit Logging**:
   - All access is logged in the `auditoriaacceso` table
   - Track user actions and data modifications

## Development

### Running Tests
```bash
# Backend tests (to be implemented)
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Database Migrations
When modifying the schema:
1. Update `database/schema.sql`
2. Create migration scripts for existing databases
3. Test on a development database first
4. Apply to all nodes in the distributed system

## Production Deployment

### Backend Deployment
1. Set `NODE_ENV=production` in environment variables
2. Use a process manager (PM2, systemd)
3. Set up reverse proxy (nginx, Apache)
4. Enable SSL/TLS
5. Configure connection pooling properly

### Frontend Deployment
1. Build the production bundle:
```bash
cd frontend
npm run build
```
2. Serve static files with nginx or other web server
3. Configure API URL for production environment

### Database
1. Configure automated backups for all nodes
2. Set up replication where needed
3. Monitor performance and optimize queries
4. Regularly update PostgreSQL and apply security patches

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC

## Support

For issues and questions, please open an issue in the GitHub repository.

## Authors

Comprehensive Hospital Management System - Distributed Architecture
