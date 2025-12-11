# Hospital Management System

## Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL (Nodes 1, 2, 3 deployed and accessible)

## Setup

1. **Install Backend Dependencies**
   ```bash
   pip install -r backend/requirements.txt
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Configure Environment**
   - Ensure `.env` is in the root directory and contains the correct database credentials.
   - The `.env` file should mimic `.env.dummy`.

## Running the Application

1. **Start Backend**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Start Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access**
   - Frontend: `http://localhost:5173` (or port shown in terminal)
   - Backend API: `http://localhost:8000/docs`

## Features
- **Location Selection**: Login as local employee.
- **Admin Access**: Login as Admin to view Global data (using dblink).
- **Appointments**: View and manage appointments.
- **Employees**: View local or global employee lists.
