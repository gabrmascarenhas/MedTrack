import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    authService
      .getCurrentUser()
      .then((current) => active && setUser(current))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));

    // Sessão expirada na API (401): limpa o estado local; o ProtectedRoute leva ao /login
    authService.onUnauthorized(() => setUser(null));
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, senha) => {
    const loggedUser = await authService.login(email, senha);
    setUser(loggedUser);
    return loggedUser;
  }, []);

  const register = useCallback(async (name, email, password, role, details) => {
    const registeredUser = await authService.register(name, email, password, role, details);
    setUser(registeredUser);
    return registeredUser;
  }, []);

  const updateProfile = useCallback(async (profile) => {
    const updatedUser = await authService.updateProfile(profile);
    setUser(updatedUser);
    return updatedUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      login,
      register,
      updateProfile,
      logout,
    }),
    [user, loading, login, register, updateProfile, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return context;
}
