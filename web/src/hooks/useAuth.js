import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fs_user')); } catch { return null; }
  });

  function login(token, userData) {
    localStorage.setItem('fs_token', token);
    localStorage.setItem('fs_user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('fs_token');
    localStorage.removeItem('fs_user');
    setUser(null);
  }

  function updateUser(patch) {
    setUser(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem('fs_user', JSON.stringify(next));
      return next;
    });
  }

  return { user, login, logout, updateUser };
}
