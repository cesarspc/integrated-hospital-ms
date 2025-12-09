import React, { useState } from 'react';
import { federatedAPI } from '../services/api';

function FederatedSearch() {
  const [searchType, setSearchType] = useState('paciente');
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      setError('Por favor ingrese un término de búsqueda');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResults(null);

      let response;
      switch (searchType) {
        case 'paciente':
          response = await federatedAPI.searchPaciente(searchTerm);
          break;
        case 'historial':
          response = await federatedAPI.getHistorialCompleto(searchTerm);
          break;
        default:
          response = await federatedAPI.searchPaciente(searchTerm);
      }

      setResults(response.data);
    } catch (err) {
      console.error('Search error:', err);
      setError('Error en la búsqueda. Verifique que el backend esté configurado correctamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderResults = () => {
    if (!results || results.length === 0) {
      return (
        <div className="alert alert-info">
          No se encontraron resultados
        </div>
      );
    }

    if (searchType === 'paciente') {
      return (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>N° Historia</th>
                <th>Nombres</th>
                <th>Apellidos</th>
                <th>Documento</th>
                <th>Grupo Sanguíneo</th>
                <th>Sede</th>
                <th>Nodo Origen</th>
              </tr>
            </thead>
            <tbody>
              {results.map((paciente, index) => (
                <tr key={index}>
                  <td>{paciente.numero_historia}</td>
                  <td>{paciente.nombres}</td>
                  <td>{paciente.apellidos}</td>
                  <td>{paciente.numero_documento}</td>
                  <td>{paciente.grupo_sanguineo || '-'}</td>
                  <td>{paciente.sede_nombre || '-'}</td>
                  <td>
                    <span style={{
                      backgroundColor: paciente.nodo_origen === 'LOCAL' ? '#d4edda' : '#d1ecf1',
                      color: paciente.nodo_origen === 'LOCAL' ? '#155724' : '#0c5460',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      {paciente.nodo_origen}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (searchType === 'historial') {
      return (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha Atención</th>
                <th>Médico</th>
                <th>Motivo</th>
                <th>Diagnóstico</th>
                <th>Tratamiento</th>
                <th>Sede</th>
                <th>Nodo Origen</th>
              </tr>
            </thead>
            <tbody>
              {results.map((record, index) => (
                <tr key={index}>
                  <td>{new Date(record.fecha_atencion).toLocaleDateString()}</td>
                  <td>{record.medico_nombre}</td>
                  <td>{record.motivo_consulta}</td>
                  <td>{record.diagnostico || '-'}</td>
                  <td>{record.tratamiento || '-'}</td>
                  <td>{record.sede_nombre || '-'}</td>
                  <td>
                    <span style={{
                      backgroundColor: record.nodo_origen === 'LOCAL' ? '#d4edda' : '#d1ecf1',
                      color: record.nodo_origen === 'LOCAL' ? '#155724' : '#0c5460',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      {record.nodo_origen}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  return (
    <div>
      <div className="card">
        <h2>Búsqueda Federada - Consultas Distribuidas</h2>
        <p>Busque información a través de múltiples nodos de bases de datos usando dblink</p>
        
        <form onSubmit={handleSearch}>
          <div className="form-group">
            <label>Tipo de Búsqueda</label>
            <select 
              className="form-control"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="paciente">Buscar Paciente por Documento</option>
              <option value="historial">Historial Clínico por N° Historia</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              {searchType === 'paciente' ? 'Número de Documento' : 'Número de Historia'}
            </label>
            <input
              type="text"
              className="form-control"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchType === 'paciente' ? 'Ej: 12345678' : 'Ej: H-001'}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Buscando...' : '🔍 Buscar en todos los nodos'}
          </button>
        </form>
      </div>

      {error && (
        <div className="card">
          <div className="alert alert-error">
            {error}
          </div>
        </div>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Consultando nodos distribuidos...</p>
        </div>
      )}

      {results && !loading && (
        <div className="card">
          <h3>Resultados de la Búsqueda Federada</h3>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            Se encontraron {results.length} registro(s) en el sistema distribuido
          </p>
          {renderResults()}
        </div>
      )}

      <div className="card" style={{ backgroundColor: '#f8f9fa', marginTop: '2rem' }}>
        <h3>ℹ️ Acerca de las Consultas Federadas</h3>
        <p>
          Este sistema utiliza <strong>dblink</strong> de PostgreSQL para realizar consultas 
          distribuidas a través de múltiples nodos de base de datos. Cada sede puede tener 
          su propia base de datos, y el sistema puede buscar información en todas ellas 
          de manera transparente.
        </p>
        <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
          <li>Las consultas se ejecutan en paralelo en todos los nodos configurados</li>
          <li>Los resultados se unifican y se presentan en una sola vista</li>
          <li>El campo "Nodo Origen" indica de qué base de datos proviene cada registro</li>
          <li>El sistema mantiene la integridad y seguridad de los datos en cada nodo</li>
        </ul>
      </div>
    </div>
  );
}

export default FederatedSearch;
