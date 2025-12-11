import React, { useState, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nodeId, setNodeId] = useState(1);
  const { login } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', {
        username,
        password,
        node_id: nodeId
      });
      login(response.data.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError('Login failed. Check credentials.');
    }
  };

  return (
    <div className="glass-card" style={{ width: '100%', maxWidth: '400px', margin: 'auto' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ textAlign: 'center', margin: '0 0 20px 0', fontSize: '2rem' }}>Bienvenido</h2>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div>
          <label>Sede</label>
          <select value={nodeId} onChange={(e) => setNodeId(Number(e.target.value))}>
            <option value={1}>Hospital Central (Nodo 1)</option>
            <option value={2}>Clínica Norte (Nodo 2)</option>
            <option value={3}>Hospital Sur (Nodo 3)</option>
          </select>
        </div>

        <div>
          <label>Correo Electrónico</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin@hospital.com"
          />
        </div>

        <div>
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button type="submit" style={{ marginTop: '10px' }}>Iniciar Sesión</button>

        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <span style={{ color: '#9ca3af', fontSize: '0.9em' }}>¿No tienes una cuenta?</span>
          <button
            type="button"
            onClick={() => navigate('/register')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary-color)',
              padding: '0 5px',
              boxShadow: 'none',
              fontSize: '0.9em',
              textDecoration: 'underline'
            }}
          >
            Registrarse
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
