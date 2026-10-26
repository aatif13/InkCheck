import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api, getStoredRole, setStoredRole, setStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: Role;
  loading: boolean;
  authEpoch: number;
  switchRole: (newRole: Role) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<Role>(getStoredRole());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authEpoch, setAuthEpoch] = useState(0);

  const initAuth = async (targetRole: Role) => {
    try {
      setLoading(true);
      const res = await api.demoLogin(targetRole);
      // Replace JWT and stored role
      setStoredToken(res.token);
      setStoredRole(targetRole);
      setUser(res.user);
      setRoleState(targetRole);
      setAuthEpoch(prev => prev + 1);

      // Notify any listening components to clear cached data
      window.dispatchEvent(new CustomEvent('inkcheck-role-changed', {
        detail: { role: targetRole, user: res.user }
      }));
    } catch (err) {
      console.error('Failed to initialize demo auth:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = getStoredRole();
    initAuth(saved);
  }, []);

  const switchRole = async (newRole: Role) => {
    await initAuth(newRole);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch {
      await initAuth(role);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, authEpoch, switchRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
