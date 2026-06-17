import axios from 'axios';
import { useAuthContext } from './useAuth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3001/api';

export function useApi() {
  const { token } = useAuthContext();

  const api = axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  return api;
}
