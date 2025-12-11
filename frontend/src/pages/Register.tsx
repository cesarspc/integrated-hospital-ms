import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, fetchFullMetadata, type RegisterData } from '../api';

const Register: React.FC = () => {
    const navigate = useNavigate();
    // Use local state for form that allows empty strings for numbers
    const [formData, setFormData] = useState<any>({
        documento: '',
        nombre_completo: '',
        telefono: '',
        correo: '',
        id_genero: 1,
        id_tipo_doc: 1,
        id_sede_origen: 1,
        id_cargo: 1,
        id_rol: 1,
        id_dept: 1,
        id_sede: 1,
        password: ''
    });
    const [metadata, setMetadata] = useState<any>({ sedes: [], cargos: [], roles: [], departments: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadMetadata(formData.id_sede);
    }, [formData.id_sede]);

    const loadMetadata = async (nodeId: number) => {
        try {
            const data = await fetchFullMetadata(nodeId);
            setMetadata(data);

            // Auto-select first options if available to prevent invalid FKs
            setFormData((prev: any) => ({
                ...prev,
                id_dept: data.departments.length > 0 ? data.departments[0].id_dept : prev.id_dept,
                id_rol: data.roles.length > 0 ? data.roles[0].id_rol : prev.id_rol,
                id_cargo: data.cargos.length > 0 ? data.cargos[0].id_cargo : prev.id_cargo,
                id_sede: data.sedes.length > 0 ? data.sedes[0].id_sede : nodeId
            }));

        } catch (err) {
            console.error("Failed to load metadata", err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: name === 'nombre_completo' || name === 'telefono' || name === 'correo' || name === 'password' ? value : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Validations and casting
            const payload: RegisterData = {
                ...formData,
                documento: Number(formData.documento),
                id_genero: Number(formData.id_genero),
                id_tipo_doc: Number(formData.id_tipo_doc),
                id_sede_origen: Number(formData.id_sede_origen),
                id_cargo: Number(formData.id_cargo),
                id_rol: Number(formData.id_rol),
                id_dept: Number(formData.id_dept),
                id_sede: Number(formData.id_sede)
            };

            await registerUser(payload);
            alert('Registro Exitoso');
            navigate('/login');
        } catch (err: any) {
            setError('Fallo en el registro. ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card" style={{ width: '100%', maxWidth: '800px', margin: '40px auto' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h2 style={{ textAlign: 'center', margin: 0, fontSize: '2rem' }}>Crear Cuenta</h2>

                {error && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Column 1: Personal Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>Información Personal</h3>

                        <div>
                            <label>Documento de Identidad</label>
                            <input type="number" name="documento" value={formData.documento} onChange={handleChange} required />
                        </div>

                        <div>
                            <label>Tipo de Documento</label>
                            <select name="id_tipo_doc" value={formData.id_tipo_doc} onChange={handleChange}>
                                <option value={1}>CC</option>
                                <option value={2}>TI</option>
                            </select>
                        </div>

                        <div>
                            <label>Nombre Completo</label>
                            <input type="text" name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} required />
                        </div>

                        <div>
                            <label>Género</label>
                            <select name="id_genero" value={formData.id_genero} onChange={handleChange}>
                                <option value={1}>Masculino</option>
                                <option value={2}>Femenino</option>
                            </select>
                        </div>

                        <div>
                            <label>Teléfono</label>
                            <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} required />
                        </div>

                        <div>
                            <label>Correo Electrónico</label>
                            <input type="email" name="correo" value={formData.correo} onChange={handleChange} required />
                        </div>

                        <div>
                            <label>Contraseña</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                        </div>
                    </div>

                    {/* Column 2: Job Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>Detalles de Empleo</h3>

                        <div>
                            <label>Sede de Origen (Base)</label>
                            <select name="id_sede_origen" value={formData.id_sede_origen} onChange={handleChange}>
                                <option value={1}>Hospital Central</option>
                                <option value={2}>Clínica Norte</option>
                                <option value={3}>Hospital Sur</option>
                            </select>
                        </div>

                        <div>
                            <label>Ubicación de Trabajo (Nodo)</label>
                            <select name="id_sede" value={formData.id_sede} onChange={handleChange}>
                                {metadata.sedes.length > 0 ? metadata.sedes.map((s: any) => (
                                    <option key={s.id_sede} value={s.id_sede}>{s.nombre_sede}</option>
                                )) : (
                                    <>
                                        <option value={1}>Hospital Central</option>
                                        <option value={2}>Clínica Norte</option>
                                        <option value={3}>Hospital Sur</option>
                                    </>
                                )}
                            </select>
                        </div>

                        <div>
                            <label>Departamento</label>
                            <select name="id_dept" value={formData.id_dept} onChange={handleChange}>
                                {metadata.departments.map((d: any) => (
                                    <option key={d.id_dept} value={d.id_dept}>{d.nom_dept}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label>Rol</label>
                            <select name="id_rol" value={formData.id_rol} onChange={handleChange}>
                                {metadata.roles.map((r: any) => (
                                    <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label>Cargo</label>
                            <select name="id_cargo" value={formData.id_cargo} onChange={handleChange}>
                                {metadata.cargos.map((c: any) => (
                                    <option key={c.id_cargo} value={c.id_cargo}>{c.nombre_cargo}</option>
                                ))}
                            </select>
                        </div>

                    </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                    <button type="submit" disabled={loading} style={{ flex: 1, background: 'linear-gradient(90deg, #ec4899, #8b5cf6)' }}>
                        {loading ? 'Registrando...' : 'Registrarse'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--glass-border)' }}
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Register;
