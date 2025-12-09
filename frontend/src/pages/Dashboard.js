import React, { useState, useEffect } from 'react';
import { federatedAPI } from '../services/api';

function Dashboard() {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const response = await federatedAPI.getEstadisticas();
      setStatistics(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading statistics:', err);
      setError('Error al cargar estadísticas. Asegúrese de que el backend esté en ejecución.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="alert alert-info">
          <h3>Bienvenido al Sistema de Gestión Hospitalaria</h3>
          <p>{error}</p>
          <p>El sistema está configurado para trabajar con múltiples nodos de base de datos distribuidos.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>Dashboard - Sistema Hospitalario Distribuido</h2>
        <p>Gestión integral de múltiples centros de salud con bases de datos distribuidas</p>
      </div>

      {statistics && (
        <>
          <div className="card">
            <h3>Estadísticas de Pacientes por Sede</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Sede</th>
                    <th>Total Pacientes</th>
                    <th>Pacientes Último Mes</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.pacientes && statistics.pacientes.length > 0 ? (
                    statistics.pacientes.map((stat, index) => (
                      <tr key={index}>
                        <td>{stat.sede_nombre || 'Sin Sede'}</td>
                        <td>{stat.total_pacientes}</td>
                        <td>{stat.pacientes_ultimo_mes}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3">No hay datos disponibles</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3>Estadísticas de Citas por Sede</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Sede</th>
                    <th>Total Citas</th>
                    <th>Citas Futuras</th>
                    <th>Citas Pasadas</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.citas && statistics.citas.length > 0 ? (
                    statistics.citas.map((stat, index) => (
                      <tr key={index}>
                        <td>{stat.sede_nombre || 'Sin Sede'}</td>
                        <td>{stat.total_citas}</td>
                        <td>{stat.citas_futuras}</td>
                        <td>{stat.citas_pasadas}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4">No hay datos disponibles</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="grid">
        <div className="stat-card">
          <h3>📋</h3>
          <p>Gestión de Pacientes</p>
        </div>
        <div className="stat-card">
          <h3>📅</h3>
          <p>Programación de Citas</p>
        </div>
        <div className="stat-card">
          <h3>👨‍⚕️</h3>
          <p>Personal Médico</p>
        </div>
        <div className="stat-card">
          <h3>🔗</h3>
          <p>Búsqueda Federada</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
