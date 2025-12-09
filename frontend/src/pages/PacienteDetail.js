import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pacienteAPI, historialAPI, citaAPI } from '../services/api';

function PacienteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPacienteData();
  }, [id]);

  const loadPacienteData = async () => {
    try {
      setLoading(true);
      const [pacienteRes, historialRes, citasRes] = await Promise.all([
        pacienteAPI.getById(id),
        historialAPI.getByPaciente(id),
        citaAPI.getByPaciente(id)
      ]);
      
      setPaciente(pacienteRes.data);
      setHistorial(historialRes.data);
      setCitas(citasRes.data);
      setError(null);
    } catch (err) {
      console.error('Error loading patient data:', err);
      setError('Error al cargar datos del paciente');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Cargando información del paciente...</p>
      </div>
    );
  }

  if (error || !paciente) {
    return (
      <div className="card">
        <div className="alert alert-error">
          {error || 'Paciente no encontrado'}
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/pacientes')}>
          Volver a la lista
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>Información del Paciente</h2>
        <div className="grid">
          <div>
            <p><strong>N° Historia:</strong> {paciente.numero_historia}</p>
            <p><strong>Nombres:</strong> {paciente.nombres}</p>
            <p><strong>Apellidos:</strong> {paciente.apellidos}</p>
            <p><strong>Documento:</strong> {paciente.numero_documento}</p>
            <p><strong>Género:</strong> {paciente.genero || '-'}</p>
          </div>
          <div>
            <p><strong>Fecha Nacimiento:</strong> {new Date(paciente.fecha_nacimiento).toLocaleDateString()}</p>
            <p><strong>Grupo Sanguíneo:</strong> {paciente.grupo_sanguineo || '-'}</p>
            <p><strong>Teléfono:</strong> {paciente.telefono || '-'}</p>
            <p><strong>Email:</strong> {paciente.email || '-'}</p>
            <p><strong>Sede:</strong> {paciente.sede || '-'}</p>
          </div>
        </div>
        
        {paciente.alergias && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
            <p><strong>⚠️ Alergias:</strong> {paciente.alergias}</p>
          </div>
        )}
        
        {paciente.enfermedades_cronicas && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8d7da', borderRadius: '5px' }}>
            <p><strong>⚕️ Enfermedades Crónicas:</strong> {paciente.enfermedades_cronicas}</p>
          </div>
        )}
        
        {paciente.contacto_emergencia && (
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Contacto de Emergencia:</strong> {paciente.contacto_emergencia} - {paciente.telefono_emergencia}</p>
          </div>
        )}
        
        <button className="btn btn-secondary" onClick={() => navigate('/pacientes')} style={{ marginTop: '1rem' }}>
          Volver a la lista
        </button>
      </div>

      <div className="card">
        <h3>Citas Programadas</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
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
                    <td>{cita.empleado_nombre}</td>
                    <td>{cita.especialidad || '-'}</td>
                    <td>{cita.tipo_servicio || '-'}</td>
                    <td>{cita.estado || '-'}</td>
                    <td>{cita.sede_nombre || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>No hay citas registradas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Historial Clínico</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Médico</th>
                <th>Motivo</th>
                <th>Diagnóstico</th>
                <th>Tratamiento</th>
                <th>Sede</th>
              </tr>
            </thead>
            <tbody>
              {historial.length > 0 ? (
                historial.map((record) => (
                  <tr key={record.id_historial}>
                    <td>{new Date(record.fecha_atencion).toLocaleDateString()}</td>
                    <td>{record.medico_nombre}</td>
                    <td>{record.motivo_consulta}</td>
                    <td>{record.diagnostico || '-'}</td>
                    <td>{record.tratamiento || '-'}</td>
                    <td>{record.sede_nombre || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>No hay historial clínico</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PacienteDetail;
