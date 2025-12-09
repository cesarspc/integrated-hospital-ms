import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pacienteAPI } from '../services/api';

function PacientesList() {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPacientes();
  }, []);

  const loadPacientes = async () => {
    try {
      setLoading(true);
      const response = await pacienteAPI.getAll();
      setPacientes(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading patients:', err);
      setError('Error al cargar pacientes. Verifique la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (id) => {
    navigate(`/pacientes/${id}`);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Cargando pacientes...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Gestión de Pacientes</h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>N° Historia</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Documento</th>
              <th>Grupo Sanguíneo</th>
              <th>Teléfono</th>
              <th>Sede</th>
              <th>Fecha Registro</th>
            </tr>
          </thead>
          <tbody>
            {pacientes.length > 0 ? (
              pacientes.map((paciente) => (
                <tr key={paciente.id_paciente} onClick={() => handleRowClick(paciente.id_paciente)}>
                  <td>{paciente.numero_historia}</td>
                  <td>{paciente.nombres}</td>
                  <td>{paciente.apellidos}</td>
                  <td>{paciente.numero_documento}</td>
                  <td>{paciente.grupo_sanguineo || '-'}</td>
                  <td>{paciente.telefono || '-'}</td>
                  <td>{paciente.sede || '-'}</td>
                  <td>{new Date(paciente.fecha_registro).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center' }}>
                  No hay pacientes registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PacientesList;
