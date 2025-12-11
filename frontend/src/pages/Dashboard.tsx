import React, { useEffect, useState, useContext } from 'react';
import api, { createAppointment, createMedicamento, createProveedor, fetchFullMetadata } from '../api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CreateModal from '../components/CreateModal';

const Dashboard: React.FC = () => {
  const { user, logout } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState('appointments');

  // Metadata for forms
  const [metadata, setMetadata] = useState<any>({ sedes: [], cargos: [], roles: [], departments: [] });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'cita', 'med', 'prov', 'rep'

  // Form State
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchData();
      if (user) {
        fetchFullMetadata(user.node_id).then(setMetadata).catch(console.error);
      }
    }
  }, [user, activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'appointments') {
        const res = await api.get('/appointments');
        setAppointments(res.data);
      } else if (activeTab === 'employees') {
        const res = await api.get('/employees');
        setEmployees(res.data);
      } else if (activeTab === 'global_meds' && user?.role === 'admin') {
        const res = await api.get('/medicamentos');
        setMedicamentos(res.data);
      } else if (activeTab === 'global_prov' && user?.role === 'admin') {
        const res = await api.get('/proveedores');
        setProveedores(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = (type: string) => {
    setModalType(type);
    setFormData({}); // Reset form
    setModalOpen(true);
  };

  const handleFormChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: any) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (modalType === 'cita') {
        await createAppointment({
          ...formData,
          id_emp: user.id_emp,
          id_dept: Number(formData.id_dept),
          id_servicio: Number(formData.id_servicio)
        });
        alert('Cita Agendada');
      } else if (modalType === 'med') {
        await createMedicamento({
          ...formData,
          stock: Number(formData.stock)
        });
        alert('Medicamento Creado');
      } else if (modalType === 'prov') {
        await createProveedor(formData);
        alert('Proveedor Creado');
      }
      setModalOpen(false);
      fetchData(); // Refresh list
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (!user) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: 'auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '2rem' }}>Panel de Control - {user.role === 'admin' ? 'Administrador' : 'Empleado'} @ Nodo {user.node_id}</h1>
        <button onClick={logout} style={{ backgroundColor: '#ef4444' }}>Cerrar Sesión</button>
      </header>

      <nav style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <button onClick={() => setActiveTab('appointments')} style={{ background: activeTab === 'appointments' ? 'var(--primary-color)' : 'transparent', border: '1px solid var(--glass-border)' }}>Citas</button>
        <button onClick={() => setActiveTab('employees')} style={{ background: activeTab === 'employees' ? 'var(--primary-color)' : 'transparent', border: '1px solid var(--glass-border)' }}>Empleados {user.role === 'admin' && '(Global)'}</button>


        {user.role === 'admin' && (
          <>
            <button onClick={() => setActiveTab('global_meds')} style={{ background: activeTab === 'global_meds' ? 'var(--primary-color)' : 'transparent', border: '1px solid var(--glass-border)' }}>Medicamentos Globales</button>
            <button onClick={() => setActiveTab('global_prov')} style={{ background: activeTab === 'global_prov' ? 'var(--primary-color)' : 'transparent', border: '1px solid var(--glass-border)' }}>Proveedores Globales</button>
          </>
        )}
      </nav>

      <main>
        {activeTab === 'appointments' && (
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Citas (Local)</h3>
              <button onClick={() => handleOpenModal('cita')} style={{ background: '#10b981' }}>+ Nueva Cita</button>
            </div>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Servicio</th>
                  <th>Estado</th>
                  <th>Médico</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id_cita}>
                    <td>{a.id_cita}</td>
                    <td>{a.fecha}</td>
                    <td>{a.hora}</td>
                    <td>{a.nom_servicio}</td>
                    <td>{a.nom_estado}</td>
                    <td>{a.medico_nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3>Empleados {user.role === 'admin' ? '(Vista Global)' : '(Vista Local)'}</h3>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Cargo</th>
                  <th>Sede</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id_emp}>
                    <td>{e.id_emp}</td>
                    <td>{e.nombre_completo}</td>
                    <td>{e.cargo}</td>
                    <td>{e.sede}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}



        {activeTab === 'global_meds' && (
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Medicamentos Globales (Vista dblink)</h3>
              <button onClick={() => handleOpenModal('med')} style={{ background: '#10b981' }}>+ Nuevo Medicamento</button>
            </div>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Stock</th>
                  <th>Unidad</th>
                </tr>
              </thead>
              <tbody>
                {medicamentos.map((m) => (
                  <tr key={m.cod_med}>
                    <td>{m.cod_med}</td>
                    <td>{m.nom_med}</td>
                    <td>{m.descripcion}</td>
                    <td>{m.stock}</td>
                    <td>{m.unidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'global_prov' && (
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Proveedores Globales (Consulta dblink)</h3>
              <button onClick={() => handleOpenModal('prov')} style={{ background: '#10b981' }}>+ Nuevo Proveedor</button>
            </div>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                </tr>
              </thead>
              <tbody>
                {proveedores.map((p) => (
                  <tr key={p.cod_prov}>
                    <td>{p.cod_prov}</td>
                    <td>{p.nombre_prov}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* CREATE MODAL */}
      <CreateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalType === 'cita' ? 'Agendar Cita' :
            modalType === 'med' ? 'Nuevo Medicamento' :
              modalType === 'prov' ? 'Nuevo Proveedor' :
                'Generar Reporte'
        }
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          {modalType === 'cita' && (
            <>
              <label>Fecha</label>
              <input type="date" name="fecha" required onChange={handleFormChange} />
              <label>Hora</label>
              <input type="time" name="hora" required onChange={handleFormChange} />
              <label>Servicio</label>
              <select name="id_servicio" required onChange={handleFormChange}>
                <option value="">Seleccione...</option>
                <option value="1">Consulta General</option>
              </select>

              <label>Departamento (ID)</label>
              <select name="id_dept" required onChange={handleFormChange}>
                <option value="">Seleccione...</option>
                {metadata.departments.map((d: any) => (
                  <option key={d.id_dept} value={d.id_dept}>{d.nom_dept}</option>
                ))}
              </select>
            </>
          )}

          {modalType === 'med' && (
            <>
              <label>Nombre</label>
              <input type="text" name="nom_med" required onChange={handleFormChange} />
              <label>Descripción</label>
              <input type="text" name="descripcion" required onChange={handleFormChange} />
              <label>Stock</label>
              <input type="number" name="stock" required onChange={handleFormChange} />
              <label>Unidad</label>
              <input type="text" name="unidad" required onChange={handleFormChange} />
            </>
          )}

          {modalType === 'prov' && (
            <>
              <label>Nombre Proveedor</label>
              <input type="text" name="nombre_prov" required onChange={handleFormChange} />
            </>
          )}



          <button type="submit" style={{ marginTop: '20px' }}>Guardar</button>
        </form>
      </CreateModal>

    </div>
  );
};

export default Dashboard;
