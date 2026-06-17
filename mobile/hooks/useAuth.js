import { useState, useEffect, createContext, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';

export const AuthContext = createContext(null);
export const useAuthContext = () => useContext(AuthContext);

export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      try {
        const t = await SecureStore.getItemAsync('fs_token');
        const u = await SecureStore.getItemAsync('fs_user');
        if (t && u) { setToken(t); setUser(JSON.parse(u)); }
      } catch {}
      setLoading(false);
    }
    restore();
  }, []);

  async function login(t, u) {
    await SecureStore.setItemAsync('fs_token', t);
    await SecureStore.setItemAsync('fs_user', JSON.stringify(u));
    setToken(t); setUser(u);
  }

  async function logout() {
    await SecureStore.deleteItemAsync('fs_token');
    await SecureStore.deleteItemAsync('fs_user');
    setToken(null); setUser(null);
  }

  return { user, token, loading, login, logout };
}
