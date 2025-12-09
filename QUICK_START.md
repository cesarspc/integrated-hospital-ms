# Quick Start Guide

Get the Distributed Hospital Management System up and running in 15 minutes!

## Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js** v18 or higher ([Download](https://nodejs.org/))
- ✅ **PostgreSQL** v14 or higher ([Download](https://www.postgresql.org/download/))
- ✅ **npm** (comes with Node.js)
- ✅ **Git** ([Download](https://git-scm.com/downloads))

## Step 1: Clone the Repository

```bash
git clone https://github.com/cesarspc/integrated-hospital-ms.git
cd integrated-hospital-ms
```

## Step 2: Set Up the Database

### Create Database

```bash
# Create the database (you may need to use sudo -u postgres on Linux)
createdb hospital_db

# Or using psql
psql -U postgres
CREATE DATABASE hospital_db;
\q
```

### Initialize Schema

```bash
# Run the schema script
psql -U postgres -d hospital_db -f backend/database/schema.sql

# Run the federated views script
psql -U postgres -d hospital_db -f backend/database/federated_views.sql
```

**Expected Output:**
```
CREATE EXTENSION
CREATE TABLE
CREATE TABLE
...
INSERT 0 4
INSERT 0 3
...
```

### Verify Database Setup

```bash
psql -U postgres -d hospital_db -c "SELECT * FROM tipodocumento;"
```

You should see 4 document types (DNI, Pasaporte, etc.)

## Step 3: Set Up Backend

### Install Dependencies

```bash
cd backend
npm install
```

### Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your database credentials
# For quick start, the defaults should work if using postgres user locally
```

**Minimal `.env` configuration:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=hospital_db
PORT=3000
CORS_ORIGIN=http://localhost:3001
```

### Start Backend Server

```bash
npm start
```

**Expected Output:**
```
Server running on port 3000
Connected to PostgreSQL database
Database connection successful
```

**Test the API:**
```bash
# In a new terminal
curl http://localhost:3000/api/health
```

Should return: `{"status":"ok","message":"Hospital Management System API"}`

## Step 4: Set Up Frontend

### Install Dependencies

```bash
# Open a new terminal
cd frontend
npm install
```

### Start Development Server

```bash
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3001
  On Your Network:  http://192.168.x.x:3001
```

The application will automatically open in your browser at `http://localhost:3001`

## Step 5: Verify Installation

### Check the Dashboard

1. Open your browser to `http://localhost:3001`
2. You should see the Hospital Management System dashboard
3. Navigate through the menu:
   - **Dashboard** - System overview
   - **Pacientes** - Patient list
   - **Citas** - Appointments
   - **Empleados** - Employees
   - **Búsqueda Federada** - Federated search

### Add Sample Data (Optional)

Add some test data to see the system in action:

```sql
-- Connect to database
psql -U postgres -d hospital_db

-- Add a sample patient
INSERT INTO persona (nombres, apellidos, id_tipodocumento, numero_documento, id_genero, fecha_nacimiento, telefono, email, direccion)
VALUES ('Juan', 'Pérez García', 1, '12345678', 1, '1980-05-15', '987654321', 'juan.perez@email.com', 'Av. Test 123');

INSERT INTO paciente (id_persona, numero_historia, grupo_sanguineo, id_sede)
VALUES (1, 'H-001', 'O+', NULL);

-- Add a sample employee (doctor)
INSERT INTO persona (nombres, apellidos, id_tipodocumento, numero_documento, id_genero, fecha_nacimiento, telefono, email, direccion)
VALUES ('María', 'García López', 1, '87654321', 2, '1985-03-20', '912345678', 'maria.garcia@hospital.com', 'Calle Doctor 456');

INSERT INTO empleado (id_persona, id_cargo, numero_empleado, fecha_contratacion, especialidad, id_rol)
VALUES (2, 2, 'E-001', '2020-01-15', 'Cardiología', 2);

-- Add a sample appointment
INSERT INTO cita (id_paciente, id_empleado, id_tipo_servicio, fecha_hora, duracion, motivo, id_estado)
VALUES (1, 1, 1, '2024-12-20 10:00:00', 30, 'Consulta de rutina', 1);

\q
```

Refresh the browser and you should see the new data!

## Quick Test Checklist

✅ Backend API responds at `http://localhost:3000/api/health`  
✅ Frontend loads at `http://localhost:3001`  
✅ Dashboard shows statistics  
✅ Can view patients list  
✅ Can view appointments list  
✅ Can view employees list  
✅ Federated search page loads  

## Common Issues and Solutions

### Issue: "Cannot connect to database"

**Solution:**
```bash
# Check if PostgreSQL is running
# On Linux/Mac:
sudo systemctl status postgresql
# or
pg_ctl status

# On Windows:
# Check Services for PostgreSQL service

# Start PostgreSQL if not running:
sudo systemctl start postgresql
```

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Find process using port 3000
# On Linux/Mac:
lsof -i :3000
# On Windows:
netstat -ano | findstr :3000

# Kill the process or change PORT in backend/.env
```

### Issue: "Port 3001 already in use"

**Solution:**
```bash
# The frontend will automatically try port 3002
# Or you can specify a different port:
PORT=3002 npm start
```

### Issue: "npm install fails"

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: "Database permission denied"

**Solution:**
```sql
-- Grant permissions to your user
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE hospital_db TO your_username;
\q
```

### Issue: "Cannot find module"

**Solution:**
```bash
# Make sure you're in the right directory
# For backend:
cd backend && npm install

# For frontend:
cd frontend && npm install
```

## Next Steps

Now that you have the system running:

1. **Explore the Features:**
   - Add more patients, appointments, and employees
   - Try the federated search functionality
   - View the dashboard statistics

2. **Configure Multiple Nodes:**
   - Follow the [DATABASE_SETUP.md](DATABASE_SETUP.md) guide for multi-node setup
   - Test federated queries across multiple databases

3. **Read the Documentation:**
   - [README.md](README.md) - Complete system documentation
   - [API_EXAMPLES.md](API_EXAMPLES.md) - API testing and examples
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment guide

4. **Customize for Your Needs:**
   - Modify the frontend styling in `frontend/src/App.css`
   - Add new endpoints in `backend/routes/`
   - Extend the database schema in `backend/database/schema.sql`

## Development Workflow

### Backend Development

```bash
cd backend

# Watch for changes (you'll need to install nodemon)
npm install -g nodemon
nodemon server.js

# View logs
tail -f logs/app.log
```

### Frontend Development

```bash
cd frontend

# Development server with hot reload
npm start

# Build for production
npm run build
```

### Database Changes

```bash
# After modifying schema.sql
psql -U postgres -d hospital_db -f backend/database/schema.sql

# After modifying federated_views.sql
psql -U postgres -d hospital_db -f backend/database/federated_views.sql
```

## Testing the Federated Features

### Configure a Second Node (Optional)

1. **Create a second database:**
```bash
createdb hospital_db_node2
psql -U postgres -d hospital_db_node2 -f backend/database/schema.sql
psql -U postgres -d hospital_db_node2 -f backend/database/federated_views.sql
```

2. **Register the node:**
```sql
psql -U postgres -d hospital_db

INSERT INTO sede (nombre, direccion, telefono, ciudad, pais, nodo_database, activo)
VALUES (
    'Hospital Norte',
    'Av. Norte 456',
    '999888777',
    'Lima',
    'Perú',
    'host=localhost port=5432 dbname=hospital_db_node2 user=postgres password=postgres',
    TRUE
);
```

3. **Test federated search:**
   - Add a patient in the second database
   - Use the Federated Search page to search by document number
   - You should see results from both databases!

## Performance Tips

### Database
- Create indexes on frequently queried columns
- Use `EXPLAIN ANALYZE` to optimize slow queries
- Regularly `VACUUM` and `ANALYZE` your database

### Backend
- Use connection pooling (already configured)
- Cache frequently accessed data
- Monitor API response times

### Frontend
- Build for production before deploying: `npm run build`
- Use lazy loading for large lists
- Implement pagination for better UX

## Getting Help

- **Issues:** Report on [GitHub Issues](https://github.com/cesarspc/integrated-hospital-ms/issues)
- **Documentation:** Check all `.md` files in the repository
- **Database Help:** See [DATABASE_SETUP.md](DATABASE_SETUP.md)
- **API Help:** See [API_EXAMPLES.md](API_EXAMPLES.md)

## Success! 🎉

You now have a fully functional distributed hospital management system running locally!

The system supports:
- ✅ Patient management across multiple health centers
- ✅ Appointment scheduling
- ✅ Medical records with prescriptions
- ✅ Employee and staff management
- ✅ Federated searches across distributed databases
- ✅ Complete audit trail

**Happy coding!** 👨‍⚕️👩‍⚕️🏥
