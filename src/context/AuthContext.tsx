'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authApi, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setToken: (token: string) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  login: (name: string, email: string, provider?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const userData = await authApi.getProfile();
      setUser(userData);
      return true;
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      // Check if user exists in localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          // Set a mock token for compatibility
          if (!localStorage.getItem('token')) {
            localStorage.setItem('token', 'mock_token_' + Date.now());
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      } else {
        // Create a default demo user
        const defaultUser: User = {
          id: 'default_user',
          name: 'Demo User',
          email: 'demo@example.com',
          picture: undefined,
          provider: undefined,
          twoFactorEnabled: false,
        };
        localStorage.setItem('user', JSON.stringify(defaultUser));
        localStorage.setItem('token', 'mock_token_' + Date.now());
        setUser(defaultUser);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback((name: string, email: string, provider?: string) => {
    const newUser: User = {
      id: generateId(),
      name,
      email,
      picture: undefined,
      provider: provider as 'google' | 'facebook' | undefined,
      twoFactorEnabled: false,
    };
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('token', 'mock_token_' + Date.now());
    setUser(newUser);
  }, []);

  const setToken = useCallback((token: string) => {
    localStorage.setItem('token', token);
    // Fetch user profile after setting token
    fetchProfile();
  }, [fetchProfile]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    // Keep user data but clear session
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, loading, setToken, logout, refreshProfile, login }}>
      {children}
    </AuthContext.Provider>
  );
}

function generateId() {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
