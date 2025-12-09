import React, { useState, useEffect } from 'react';
import { empleadoAPI } from '../services/api';

function EmpleadosList() {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEmpleados();
  }, []);

  const loadEmpleados = async () => {
    try {
      setLoading(true);
      const response = await empleadoAPI.getAll();
      setEmpleados(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading employees:', err);
      setError('Error al cargar empleados. Verifique la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Cargando empleados...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Gestión de Empleados</h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>N° Empleado</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Cargo</th>
              <th>Departamento</th>
              <th>Especialidad</th>
              <th>Rol</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Sede</th>
            </tr>
          </thead>
          <tbody>
            {empleados.length > 0 ? (
              empleados.map((empleado) => (
                <tr key={empleado.id_empleado}>
                  <td>{empleado.numero_empleado}</td>
                  <td>{empleado.nombres}</td>
                  <td>{empleado.apellidos}</td>
                  <td>{empleado.cargo || '-'}</td>
                  <td>{empleado.departamento || '-'}</td>
                  <td>{empleado.especialidad || '-'}</td>
                  <td>{empleado.rol || '-'}</td>
                  <td>{empleado.telefono || '-'}</td>
                  <td>{empleado.email || '-'}</td>
                  <td>{empleado.sede_nombre || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center' }}>
                  No hay empleados registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EmpleadosList;
