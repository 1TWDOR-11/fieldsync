import React, { createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Occurrences from './pages/Occurrences';
import Users from './pages/Users';
import Summary from './pages/Summary';
import Reports from './pages/Reports';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Layout from './components/Layout';

export const AuthContext = createContext(null);
export const useAuthContext = () => useContext(AuthContext);

function PrivateRoute({ children }) {
  const { user } = useAuthContext();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const auth = useAuth();
  return (
    <ThemeProvider>
    <AuthContext.Provider value={auth}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="summary" element={<Summary />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="occurrences" element={<Occurrences />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<Users />} />
            <Route path="admin" element={<Admin />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
    </ThemeProvider>
  );
}
