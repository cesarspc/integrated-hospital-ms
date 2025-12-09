import React, { useState, useEffect } from 'react';
import { citaAPI } from '../services/api';

function CitasList() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCitas();
  }, []);

  const loadCitas = async () => {
    try {
      setLoading(true);
      const response = await citaAPI.getAll();
      setCitas(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError('Error al cargar citas. Verifique la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoClass = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'confirmado':
        return { backgroundColor: '#d4edda', color: '#155724' };
      case 'pendiente':
        return { backgroundColor: '#fff3cd', color: '#856404' };
      case 'cancelado':
        return { backgroundColor: '#f8d7da', color: '#721c24' };
      case 'completado':
        return { backgroundColor: '#d1ecf1', color: '#0c5460' };
      default:
        return {};
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Cargando citas...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Gestión de Citas</h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Paciente</th>
              <th>N° Historia</th>
              <th>Médico</th>
              <th>Especialidad</th>
              <th>Tipo Servicio</th>
              <th>Estado</th>
              <th>Sede</th>
            </tr>
          </thead>
          <tbody>
            {citas.length > 0 ? (
              citas.map((cita) => (
                <tr key={cita.id_cita}>
                  <td>{new Date(cita.fecha_hora).toLocaleString()}</td>
                  <td>{cita.paciente_nombre}</td>
                  <td>{cita.numero_historia}</td>
                  <td>{cita.empleado_nombre}</td>
                  <td>{cita.especialidad || '-'}</td>
                  <td>{cita.tipo_servicio || '-'}</td>
                  <td>
                    <span style={{
                      ...getEstadoClass(cita.estado),
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      {cita.estado || '-'}
                    </span>
                  </td>
                  <td>{cita.sede_nombre || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center' }}>
                  No hay citas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CitasList;
