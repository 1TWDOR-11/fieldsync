import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : 'https://fieldsync-api.onrender.com/api');

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('fs_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;
