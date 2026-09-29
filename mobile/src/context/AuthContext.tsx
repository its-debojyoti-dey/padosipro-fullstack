import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredSession, storeSession, clearSession, apiClient } from '../services/api';

export interface UserSession {
  id: string;
  email: string;
  hasProfile: boolean;
}

interface AuthContextType {
  token: string | null;
  user: UserSession | null;
  isLoading: boolean;
  login: (token: string, user: UserSession) => Promise<void>;
  logout: () => Promise<void>;
  markProfileCompleted: () => void;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from SecureStore on app launch
  useEffect(() => {
    async function restoreSession() {
      try {
        const session = await getStoredSession();
        if (session.token && session.user) {
          setToken(session.token);
          setUser(session.user);

          // Verify if profile is still up-to-date with backend
          try {
            const res = await apiClient.get('/user/profile', {
              headers: { Authorization: `Bearer ${session.token}` },
            });
            if (res.data?.profile) {
              setUser((prev) => (prev ? { ...prev, hasProfile: true } : null));
            }
          } catch (e) {
            // Token may have expired
            console.log('Session verification check:', e);
          }
        }
      } catch (err) {
        console.warn('Session restoration error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (newToken: string, newUser: UserSession) => {
    setToken(newToken);
    setUser(newUser);
    await storeSession(newToken, newUser);
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await clearSession();
  };

  const markProfileCompleted = async () => {
    if (user) {
      const updated = { ...user, hasProfile: true };
      setUser(updated);
      if (token) {
        await storeSession(token, updated);
      }
    }
  };

  const refreshUserProfile = async () => {
    if (!token) return;
    try {
      const res = await apiClient.get('/user/profile');
      if (res.data?.profile) {
        markProfileCompleted();
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        login,
        logout,
        markProfileCompleted,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
