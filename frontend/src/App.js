import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Import pages
import Dashboard from './pages/Dashboard';
import PacientesList from './pages/PacientesList';
import PacienteDetail from './pages/PacienteDetail';
import CitasList from './pages/CitasList';
import EmpleadosList from './pages/EmpleadosList';
import FederatedSearch from './pages/FederatedSearch';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <h1>Hospital Management System</h1>
            <ul className="nav-links">
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/pacientes">Pacientes</Link></li>
              <li><Link to="/citas">Citas</Link></li>
              <li><Link to="/empleados">Empleados</Link></li>
              <li><Link to="/federated">Búsqueda Federada</Link></li>
            </ul>
          </div>
        </nav>

        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pacientes" element={<PacientesList />} />
            <Route path="/pacientes/:id" element={<PacienteDetail />} />
            <Route path="/citas" element={<CitasList />} />
            <Route path="/empleados" element={<EmpleadosList />} />
            <Route path="/federated" element={<FederatedSearch />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
