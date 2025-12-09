# Database Setup Guide

This guide will help you set up the distributed hospital management database system.

## Single Node Setup (Development)

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download and install from https://www.postgresql.org/download/windows/

### 2. Create Database User

```bash
# Login as postgres user
sudo -u postgres psql

# Create a new user
CREATE USER hospital_admin WITH PASSWORD 'secure_password';

# Grant privileges
ALTER USER hospital_admin WITH SUPERUSER;

# Exit
\q
```

### 3. Create Database

```bash
# Create the database
createdb -U hospital_admin hospital_db

# Or from psql
psql -U postgres
CREATE DATABASE hospital_db OWNER hospital_admin;
\q
```

### 4. Enable dblink Extension

```bash
psql -U hospital_admin -d hospital_db
CREATE EXTENSION IF NOT EXISTS dblink;
\q
```

### 5. Initialize Schema

```bash
# Navigate to backend directory
cd backend

# Run schema creation
psql -U hospital_admin -d hospital_db -f database/schema.sql

# Run federated views creation
psql -U hospital_admin -d hospital_db -f database/federated_views.sql
```

### 6. Verify Installation

```bash
psql -U hospital_admin -d hospital_db

-- Check tables
\dt

-- Check extensions
\dx

-- Check sample data
SELECT * FROM tipodocumento;
SELECT * FROM genero;
SELECT * FROM estado;

\q
```

## Multi-Node Setup (Production/Distributed)

### Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Node 1 (Main) │         │   Node 2        │         │   Node 3        │
│   Hospital A    │◄───────►│   Hospital B    │◄───────►│   Hospital C    │
│   Lima          │         │   Arequipa      │         │   Cusco         │
└─────────────────┘         └─────────────────┘         └─────────────────┘
         │                           │                           │
         └───────────────────────────┴───────────────────────────┘
                         dblink connections
```

### Setup Node 1 (Main Node)

1. **Install PostgreSQL** (as above)

2. **Create and initialize database:**
```bash
createdb -U postgres hospital_db_node1
psql -U postgres -d hospital_db_node1 -f backend/database/schema.sql
psql -U postgres -d hospital_db_node1 -f backend/database/federated_views.sql
```

3. **Configure pg_hba.conf for remote connections:**
```bash
# Edit pg_hba.conf (location varies by OS)
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Add this line to allow remote connections
host    all             all             0.0.0.0/0            md5
```

4. **Configure postgresql.conf:**
```bash
sudo nano /etc/postgresql/16/main/postgresql.conf

# Change listen_addresses
listen_addresses = '*'
```

5. **Restart PostgreSQL:**
```bash
sudo systemctl restart postgresql
```

6. **Insert main node information:**
```sql
psql -U postgres -d hospital_db_node1

INSERT INTO sede (nombre, direccion, telefono, ciudad, pais, activo)
VALUES (
    'Hospital Central Lima',
    'Av. Principal 123',
    '+51-1-1234567',
    'Lima',
    'Perú',
    TRUE
);
```

### Setup Node 2 (Remote Node)

1. **On Node 2 server, create database:**
```bash
createdb -U postgres hospital_db_node2
psql -U postgres -d hospital_db_node2 -f backend/database/schema.sql
psql -U postgres -d hospital_db_node2 -f backend/database/federated_views.sql
```

2. **Configure for remote access** (same as Node 1)

3. **Insert node information:**
```sql
INSERT INTO sede (nombre, direccion, telefono, ciudad, pais, activo)
VALUES (
    'Hospital Regional Arequipa',
    'Calle Secundaria 456',
    '+51-54-234567',
    'Arequipa',
    'Perú',
    TRUE
);
```

### Configure dblink Between Nodes

#### On Node 1 (Main):

```sql
-- Register Node 2 as a remote node
INSERT INTO sede (nombre, direccion, telefono, ciudad, pais, nodo_database, activo)
VALUES (
    'Hospital Regional Arequipa',
    'Calle Secundaria 456',
    '+51-54-234567',
    'Arequipa',
    'Perú',
    'host=192.168.1.100 port=5432 dbname=hospital_db_node2 user=postgres password=secure_pass',
    TRUE
);

-- Test dblink connection
SELECT * FROM dblink(
    'host=192.168.1.100 port=5432 dbname=hospital_db_node2 user=postgres password=secure_pass',
    'SELECT count(*) FROM paciente'
) AS t(count bigint);
```

#### Security Best Practices for dblink:

1. **Use SSL connections:**
```sql
-- Add sslmode=require to connection string
'host=192.168.1.100 port=5432 dbname=hospital_db_node2 user=postgres password=secure_pass sslmode=require'
```

2. **Create read-only user for federated queries:**
```sql
-- On each node
CREATE USER federated_reader WITH PASSWORD 'another_secure_pass';
GRANT CONNECT ON DATABASE hospital_db_node2 TO federated_reader;
GRANT USAGE ON SCHEMA public TO federated_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO federated_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO federated_reader;
```

3. **Use connection string with read-only user:**
```sql
UPDATE sede 
SET nodo_database = 'host=192.168.1.100 port=5432 dbname=hospital_db_node2 user=federated_reader password=readonly_pass sslmode=require'
WHERE nombre = 'Hospital Regional Arequipa';
```

## Testing Federated Queries

### 1. Test Patient Search Across Nodes

```sql
-- Search for a patient by document number across all nodes
SELECT * FROM buscar_paciente_federado('12345678');
```

### 2. Test Medical History Retrieval

```sql
-- Get complete medical history from all nodes
SELECT * FROM obtener_historial_completo_paciente('H-001');
```

### 3. Test Appointment Queries

```sql
-- Get appointments across all nodes for a date range
SELECT * FROM obtener_citas_rango_fechas('2024-01-01', '2024-12-31');
```

### 4. Test Equipment Inventory

```sql
-- Get equipment inventory from all nodes
SELECT * FROM inventario_equipamiento_federado();
```

### 5. Test Federated Views

```sql
-- View all patients from all nodes
SELECT * FROM v_pacientes_federados;

-- View all appointments from all nodes
SELECT * FROM v_citas_federadas LIMIT 100;

-- View statistics
SELECT * FROM v_estadisticas_pacientes;
SELECT * FROM v_estadisticas_citas;
```

## Sample Data Insertion

### Insert Sample Patients

```sql
-- Insert a person
INSERT INTO persona (nombres, apellidos, id_tipodocumento, numero_documento, id_genero, fecha_nacimiento, telefono, email, direccion)
VALUES ('Juan', 'Pérez García', 1, '12345678', 1, '1980-05-15', '987654321', 'juan.perez@email.com', 'Av. Test 123')
RETURNING id_persona;

-- Insert patient (use the returned id_persona)
INSERT INTO paciente (id_persona, numero_historia, grupo_sanguineo, id_sede)
VALUES (1, 'H-001', 'O+', 1);
```

### Insert Sample Employees

```sql
-- Insert person
INSERT INTO persona (nombres, apellidos, id_tipodocumento, numero_documento, id_genero, fecha_nacimiento, telefono, email, direccion)
VALUES ('María', 'García López', 1, '87654321', 2, '1985-03-20', '912345678', 'maria.garcia@hospital.com', 'Calle Doctor 456')
RETURNING id_persona;

-- Insert employee (use the returned id_persona)
INSERT INTO empleado (id_persona, id_cargo, id_departamento, id_rol, numero_empleado, fecha_contratacion, especialidad, licencia_medica)
VALUES (2, 2, 1, 2, 'E-001', '2020-01-15', 'Cardiología', 'CMP-12345');
```

### Insert Sample Appointment

```sql
INSERT INTO cita (id_paciente, id_empleado, id_tipo_servicio, fecha_hora, duracion, motivo, id_estado, id_sede)
VALUES (1, 1, 2, '2024-12-15 10:00:00', 45, 'Consulta de control', 2, 1);
```

### Insert Sample Medical Record

```sql
INSERT INTO historialclinica (id_paciente, id_empleado, id_cita, motivo_consulta, sintomas, diagnostico, tratamiento, id_sede)
VALUES (
    1, 1, 1,
    'Dolor en el pecho',
    'Dolor torácico, dificultad respiratoria',
    'Angina de pecho',
    'Reposo, medicación antianginosa',
    1
);
```

## Troubleshooting

### Connection Issues

1. **Check PostgreSQL is running:**
```bash
sudo systemctl status postgresql
```

2. **Check port is open:**
```bash
sudo netstat -plunt | grep 5432
```

3. **Test local connection:**
```bash
psql -U postgres -d hospital_db -h localhost
```

4. **Test remote connection:**
```bash
psql -U postgres -d hospital_db -h remote_host
```

### dblink Issues

1. **Extension not installed:**
```sql
CREATE EXTENSION dblink;
```

2. **Connection refused:**
- Check firewall rules
- Verify pg_hba.conf allows connections
- Check postgresql.conf listen_addresses

3. **Test dblink directly:**
```sql
SELECT dblink_connect('test_conn', 'host=localhost dbname=hospital_db');
SELECT * FROM dblink('test_conn', 'SELECT 1') AS t(result int);
SELECT dblink_disconnect('test_conn');
```

### Performance Issues

1. **Create indexes on frequently queried columns**
2. **Analyze query plans:**
```sql
EXPLAIN ANALYZE SELECT * FROM buscar_paciente_federado('12345678');
```

3. **Monitor slow queries:**
```sql
-- Enable slow query logging in postgresql.conf
log_min_duration_statement = 1000  # Log queries taking more than 1 second
```

## Backup and Recovery

### Backup Single Node

```bash
# Backup database
pg_dump -U postgres hospital_db > hospital_db_backup.sql

# Backup with compression
pg_dump -U postgres hospital_db | gzip > hospital_db_backup.sql.gz

# Restore
psql -U postgres -d hospital_db < hospital_db_backup.sql
```

### Backup All Nodes

```bash
#!/bin/bash
# backup_all_nodes.sh

NODES=("node1_host" "node2_host" "node3_host")
DATABASES=("hospital_db_node1" "hospital_db_node2" "hospital_db_node3")
DATE=$(date +%Y%m%d_%H%M%S)

for i in "${!NODES[@]}"; do
    echo "Backing up ${DATABASES[$i]} on ${NODES[$i]}"
    pg_dump -h ${NODES[$i]} -U postgres ${DATABASES[$i]} | gzip > "backup_${DATABASES[$i]}_${DATE}.sql.gz"
done

echo "All backups completed"
```

## Monitoring

### Check Database Size

```sql
SELECT pg_size_pretty(pg_database_size('hospital_db'));
```

### Check Table Sizes

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Active Connections

```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'hospital_db';
```

### Monitor Federated Queries

```sql
-- Check dblink connections
SELECT * FROM pg_stat_activity WHERE query LIKE '%dblink%';
```

## Maintenance

### Vacuum and Analyze

```bash
# Regular maintenance
vacuumdb -U postgres -d hospital_db -z -v

# Full vacuum (requires more time and locks)
vacuumdb -U postgres -d hospital_db -f -z -v
```

### Update Statistics

```sql
ANALYZE;
-- Or for specific table
ANALYZE paciente;
```

### Reindex

```sql
REINDEX DATABASE hospital_db;
-- Or for specific table
REINDEX TABLE paciente;
```
