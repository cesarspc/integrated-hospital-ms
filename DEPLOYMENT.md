# Deployment Guide

This guide covers deploying the Distributed Hospital Management System to production.

## Table of Contents

1. [Production Architecture](#production-architecture)
2. [Server Requirements](#server-requirements)
3. [Database Deployment](#database-deployment)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Security Hardening](#security-hardening)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Backup Strategy](#backup-strategy)
9. [Disaster Recovery](#disaster-recovery)

## Production Architecture

```
                                   Internet
                                      |
                                  [Load Balancer]
                                      |
                    +-----------------+------------------+
                    |                                    |
              [Web Server 1]                       [Web Server 2]
              (Frontend + API)                     (Frontend + API)
                    |                                    |
                    +----------------+-------------------+
                                     |
                              [API Gateway]
                                     |
                    +----------------+------------------+
                    |                |                  |
              [Node 1 DB]       [Node 2 DB]       [Node 3 DB]
              (Hospital A)       (Hospital B)       (Hospital C)
                    |                |                  |
                [Replica]        [Replica]          [Replica]
```

## Server Requirements

### Minimum Requirements per Node

#### Database Server
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 100 GB SSD
- **OS**: Ubuntu 22.04 LTS or similar
- **PostgreSQL**: Version 14+

#### Application Server
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 20 GB
- **OS**: Ubuntu 22.04 LTS
- **Node.js**: Version 18 LTS

#### Recommended for Production
- **Database**: 8 cores, 16 GB RAM, 500 GB SSD
- **Application**: 4 cores, 8 GB RAM, 50 GB SSD

## Database Deployment

### 1. Install PostgreSQL on Each Node

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Configure PostgreSQL for Production

Edit `/etc/postgresql/16/main/postgresql.conf`:

```conf
# Connection Settings
listen_addresses = '*'
max_connections = 200
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 20971kB
min_wal_size = 2GB
max_wal_size = 8GB

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_connections = on
log_disconnections = on
log_line_prefix = '%m [%p] %q%u@%d '

# SSL Configuration
ssl = on
ssl_cert_file = '/etc/ssl/certs/server.crt'
ssl_key_file = '/etc/ssl/private/server.key'
```

Edit `/etc/postgresql/16/main/pg_hba.conf`:

```conf
# Local connections
local   all             postgres                                peer
local   all             all                                     md5

# Remote connections (use specific IPs in production)
hostssl all             all             10.0.0.0/8              md5
hostssl all             all             0.0.0.0/0               md5
```

### 3. Restart PostgreSQL

```bash
sudo systemctl restart postgresql
```

### 4. Create Production Database

```bash
# Create database user
sudo -u postgres psql << EOF
CREATE USER hospital_prod WITH PASSWORD 'STRONG_PASSWORD_HERE';
CREATE DATABASE hospital_prod OWNER hospital_prod;
\c hospital_prod
CREATE EXTENSION IF NOT EXISTS dblink;
GRANT ALL PRIVILEGES ON DATABASE hospital_prod TO hospital_prod;
EOF

# Initialize schema
sudo -u postgres psql -d hospital_prod -f /path/to/backend/database/schema.sql
sudo -u postgres psql -d hospital_prod -f /path/to/backend/database/federated_views.sql
```

### 5. Configure Database Replication (Optional but Recommended)

#### On Primary Server

Edit `postgresql.conf`:
```conf
wal_level = replica
max_wal_senders = 3
wal_keep_size = 1GB
```

Create replication user:
```sql
CREATE USER replicator REPLICATION LOGIN ENCRYPTED PASSWORD 'replication_password';
```

#### On Replica Server

```bash
# Stop PostgreSQL
sudo systemctl stop postgresql

# Remove existing data
sudo rm -rf /var/lib/postgresql/16/main/*

# Base backup from primary
sudo -u postgres pg_basebackup -h primary_server_ip -D /var/lib/postgresql/16/main -U replicator -P -v -R -X stream -C -S replica_1

# Start PostgreSQL
sudo systemctl start postgresql
```

## Backend Deployment

### 1. Prepare Server

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Install PM2 globally
sudo npm install -g pm2

# Create application directory
sudo mkdir -p /opt/hospital-ms
sudo chown $USER:$USER /opt/hospital-ms
```

### 2. Deploy Application Code

```bash
# Clone or copy the application
cd /opt/hospital-ms
git clone https://github.com/yourusername/integrated-hospital-ms.git
cd integrated-hospital-ms/backend

# Install dependencies
npm ci --production
```

### 3. Configure Environment

Create `/opt/hospital-ms/integrated-hospital-ms/backend/.env`:

```env
NODE_ENV=production
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=hospital_prod
DB_PASSWORD=STRONG_PASSWORD_HERE
DB_NAME=hospital_prod

# CORS Configuration
CORS_ORIGIN=https://your-domain.com

# Security
SESSION_SECRET=RANDOM_SECRET_HERE
JWT_SECRET=ANOTHER_RANDOM_SECRET_HERE
```

### 4. Start with PM2

```bash
# Start application
pm2 start server.js --name hospital-api

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup systemd
# Run the command that PM2 outputs

# Monitor
pm2 logs hospital-api
pm2 monit
```

### 5. Configure Nginx as Reverse Proxy

Install Nginx:
```bash
sudo apt install nginx -y
```

Create `/etc/nginx/sites-available/hospital-ms`:

```nginx
upstream hospital_api {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001; # Add more instances if load balanced
    keepalive 64;
}

server {
    listen 80;
    server_name api.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Logging
    access_log /var/log/nginx/hospital-api-access.log;
    error_log /var/log/nginx/hospital-api-error.log;

    location / {
        proxy_pass http://hospital_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;
}
```

Enable and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/hospital-ms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL Certificate with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.your-domain.com
```

## Frontend Deployment

### 1. Build Frontend

```bash
cd /opt/hospital-ms/integrated-hospital-ms/frontend

# Install dependencies
npm ci

# Set production API URL
echo "REACT_APP_API_URL=https://api.your-domain.com/api" > .env.production

# Build
npm run build
```

### 2. Configure Nginx for Frontend

Create `/etc/nginx/sites-available/hospital-frontend`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    root /opt/hospital-ms/integrated-hospital-ms/frontend/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/hospital-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Security Hardening

### 1. Firewall Configuration

```bash
# Install UFW
sudo apt install ufw -y

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL only from specific IPs (adjust as needed)
sudo ufw allow from 10.0.0.0/8 to any port 5432

# Enable firewall
sudo ufw enable
```

### 2. PostgreSQL Security

```bash
# Disable PostgreSQL remote root access
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'strong_password';

# Create application-specific users with limited privileges
CREATE USER api_user WITH PASSWORD 'api_password';
GRANT CONNECT ON DATABASE hospital_prod TO api_user;
GRANT USAGE ON SCHEMA public TO api_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO api_user;
```

### 3. System Security

```bash
# Keep system updated
sudo apt update && sudo apt upgrade -y

# Install fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Configure automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Monitoring and Maintenance

### 1. Set Up Monitoring

Install monitoring tools:
```bash
# Install Prometheus Node Exporter
wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz
tar xvfz node_exporter-1.6.1.linux-amd64.tar.gz
sudo mv node_exporter-1.6.1.linux-amd64/node_exporter /usr/local/bin/
sudo useradd -rs /bin/false node_exporter

# Create systemd service
sudo tee /etc/systemd/system/node_exporter.service << EOF
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl start node_exporter
sudo systemctl enable node_exporter
```

### 2. Log Management

```bash
# Install and configure logrotate
sudo tee /etc/logrotate.d/hospital-ms << EOF
/var/log/nginx/hospital-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 \`cat /var/run/nginx.pid\`
    endscript
}

/opt/hospital-ms/integrated-hospital-ms/backend/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
}
EOF
```

### 3. Health Checks

Create monitoring script `/opt/hospital-ms/health-check.sh`:

```bash
#!/bin/bash

# Check API health
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "$(date): API is healthy"
else
    echo "$(date): API health check failed" >> /var/log/hospital-health.log
    # Restart API
    pm2 restart hospital-api
fi

# Check database connectivity
if sudo -u postgres psql -d hospital_prod -c "SELECT 1" > /dev/null 2>&1; then
    echo "$(date): Database is healthy"
else
    echo "$(date): Database health check failed" >> /var/log/hospital-health.log
fi
```

Add to crontab:
```bash
*/5 * * * * /opt/hospital-ms/health-check.sh
```

## Backup Strategy

### 1. Automated Database Backups

Create backup script `/opt/hospital-ms/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/backups/hospital-ms"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="hospital_prod"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U hospital_prod $DB_NAME | gzip > $BACKUP_DIR/hospital_db_${DATE}.sql.gz

# Remove backups older than 30 days
find $BACKUP_DIR -name "hospital_db_*.sql.gz" -mtime +30 -delete

# Upload to cloud storage (example with AWS S3)
# aws s3 cp $BACKUP_DIR/hospital_db_${DATE}.sql.gz s3://your-bucket/backups/

echo "Backup completed: hospital_db_${DATE}.sql.gz"
```

Schedule daily backups:
```bash
# Add to crontab
0 2 * * * /opt/hospital-ms/backup.sh >> /var/log/hospital-backup.log 2>&1
```

### 2. Application Backups

```bash
# Backup application code and configuration
tar -czf /backups/hospital-ms/app_backup_$(date +%Y%m%d).tar.gz \
    /opt/hospital-ms/integrated-hospital-ms \
    --exclude=node_modules \
    --exclude=build
```

## Disaster Recovery

### Recovery Procedure

1. **Database Recovery:**
```bash
# Restore from backup
gunzip -c /backups/hospital-ms/hospital_db_YYYYMMDD_HHMMSS.sql.gz | \
    psql -U hospital_prod hospital_prod
```

2. **Application Recovery:**
```bash
# Extract application backup
tar -xzf /backups/hospital-ms/app_backup_YYYYMMDD.tar.gz -C /

# Reinstall dependencies
cd /opt/hospital-ms/integrated-hospital-ms/backend
npm ci --production

# Restart services
pm2 restart hospital-api
```

3. **Test Recovery:**
```bash
# Verify API
curl http://localhost:3000/api/health

# Verify database
psql -U hospital_prod -d hospital_prod -c "SELECT count(*) FROM paciente"
```

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer Setup:**
   - Use HAProxy or AWS ELB
   - Configure health checks
   - Enable session affinity if needed

2. **Multiple API Instances:**
   ```bash
   # On each server
   pm2 start server.js -i max --name hospital-api
   ```

3. **Database Read Replicas:**
   - Configure streaming replication
   - Route read queries to replicas
   - Keep writes on primary

### Vertical Scaling

1. **Increase server resources**
2. **Tune PostgreSQL configuration**
3. **Optimize database queries**
4. **Add caching layer (Redis)**

## Troubleshooting

### Common Issues

1. **High Database Load:**
   ```sql
   -- Check slow queries
   SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
   ```

2. **Memory Issues:**
   ```bash
   # Check system memory
   free -h
   
   # Check PostgreSQL memory
   ps aux | grep postgres
   ```

3. **Connection Pool Exhaustion:**
   - Increase `max_connections` in PostgreSQL
   - Adjust connection pool size in application
   - Check for connection leaks

## Post-Deployment Checklist

- [ ] Database backups running automatically
- [ ] SSL certificates installed and auto-renewing
- [ ] Monitoring and alerts configured
- [ ] Firewall rules properly configured
- [ ] Application logs rotating properly
- [ ] Health checks running
- [ ] Security patches up to date
- [ ] Documentation updated
- [ ] Team trained on deployment procedures
- [ ] Disaster recovery plan tested

## Support and Maintenance

### Regular Maintenance Tasks

- **Daily:** Review logs and monitoring alerts
- **Weekly:** Check backup integrity, review performance metrics
- **Monthly:** Apply security updates, review disk space
- **Quarterly:** Test disaster recovery procedures, review and update documentation
