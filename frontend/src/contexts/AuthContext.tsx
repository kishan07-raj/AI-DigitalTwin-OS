import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useStore } from '../store';
import api from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  preferences?: Record<string, any>;
  digitalTwin?: Record<string, any>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const store = useStore();
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // Check if we have a token in localStorage (persisted store)
      const storedToken = store.token;
      
      if (storedToken) {
        // Token exists, try to restore user session
        api.setToken(storedToken);
        try {
          const response = await api.getMe();
          const user = response.data.data || response.data;
          store.setAuthLoading(false);
        } catch (error) {
          // Token is invalid, clear auth state
          console.log('Token validation failed, clearing auth state');
          store.logout();
        }
      } else {
        // No token, mark auth as not loading
        store.setAuthLoading(false);
      }
      setIsInitializing(false);
    };

    initializeAuth();
  }, []);

  // Provide values from store but override authLoading to include initialization
  const value: AuthContextType = {
    user: store.user,
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    authLoading: isInitializing || store.authLoading,
    login: store.login,
    register: store.register,
    logout: store.logout,
    loadUser: store.loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

