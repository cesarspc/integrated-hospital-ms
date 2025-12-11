import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface RegisterData {
  documento: number;
  nombre_completo: string;
  telefono: string;
  correo: string;
  id_genero: number;
  id_tipo_doc: number;
  id_sede_origen: number;
  id_cargo: number;
  id_rol: number;
  id_dept: number;
  id_sede: number;
  password: string;
}

export const registerUser = async (data: RegisterData) => {
  return await api.post('/auth/register', data);
};

export const fetchFullMetadata = async (nodeId: number) => {
  // We need to fetch metadata. The endpoint requires node_id.
  // However, for registration, we might not have a logged-in user with a node_id preference yet?
  // Or we pick a default one to get the lists. 
  // Let's assume passed nodeId.
  const response = await api.get(`/metadata/full?node_id=${nodeId}`);
  return response.data;
};

export const createAppointment = async (data: any) => {
  return await api.post('/appointments', data);
};

export const createMedicamento = async (data: any) => {
  return await api.post('/medicamentos', data);
};

export const createProveedor = async (data: any) => {
  return await api.post('/proveedores', data);
};

export const createReport = async (data: any) => {
  return await api.post('/reports', data);
};

export const fetchReports = async () => {
  const response = await api.get('/reports');
  return response.data;
};

export default api;
