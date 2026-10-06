import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '../api/authApi';
import { AuthExpiredError } from '../api/client';
import { authService } from '../services/authService';

import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoaded: boolean;
  reloadUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const queryClient = useQueryClient();

  const loadUser = useCallback(async () => {
    try {
      const profile = await authService.syncSession();
      if (!profile) {
        setUser(null);
        setIsLoggedIn(false);
        return;
      }
      
      setUser(profile);
      setIsLoggedIn(true);
    } catch (e) {
      if (e instanceof AuthExpiredError) {
        // Token was invalid/expired and refresh failed
        setUser(null);
        setIsLoggedIn(false);
      } else {
        console.warn('Failed to load user profile from API', e);
        // We might be offline, keep existing state if possible or fail gracefully
      }
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsLoggedIn(false);
      queryClient.clear();
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isLoaded, reloadUser: loadUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

