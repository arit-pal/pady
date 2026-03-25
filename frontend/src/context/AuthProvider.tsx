import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextType } from './Auth';
import { AuthContext } from './Auth';
import { apiClient } from '../api/Api';
import type { User } from '../models/Models';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('pady_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem('pady_token');
    setToken(null);
    setUser(null);
  }, []);

  const fetchUser = useCallback(async (authToken: string) => {
    try {
      const response = await apiClient.get<{ user: User }>('/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setUser(response.data.user);
    } catch (error) {
      console.error("Failed to fetch user", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      fetchUser(token);
    } else {
      setIsLoading(false);
    }
  }, [token, fetchUser]);

  const login = async (newToken: string) => {
    localStorage.setItem('pady_token', newToken);
    setToken(newToken);
    await fetchUser(newToken);
  };

  const value: AuthContextType = { user, token, isLoading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
