import axios from 'axios';

// Vacio en produccion (mismo origen, Nginx proxea /api) y vacio en desarrollo
// (Vite proxea /api, ver vite.config.js). Solo hace falta completar
// VITE_API_URL si el frontend vive en un dominio distinto al backend.
const baseURL = `${import.meta.env.VITE_API_URL || ''}/api`;

const apiClient = axios.create({ baseURL });

// Cuelga el JWT guardado (si hay) en cada request saliente.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('comandy_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el backend responde 401 (token vencido/invalido), limpiamos la sesion
// y mandamos al login. Evita que la app quede en un estado "logueado" falso.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('comandy_token');
      localStorage.removeItem('comandy_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
