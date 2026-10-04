import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole, AccountStatus } from '../types/roles';
import { api, setStoredToken, getStoredToken } from '../services/api';

interface AuthContextType {
  currentUser: UserProfile | null;
  currentRole: UserRole;
  accountStatus: AccountStatus | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  registerUser: (data: {
    role: 'BUYER' | 'SELLER' | 'DEVELOPER';
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    state?: string;
    city?: string;
    sellerRelationship?: 'OWNER' | 'REPRESENTATIVE';
    companyName?: string;
    cacNumber?: string;
  }) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserStatus: (uid: string, status: AccountStatus, reason?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth on load
  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.auth.me();
      setCurrentUser(res.user);
    } catch {
      // Invalid/expired token
      setStoredToken(null);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.auth.login(credentials);
    setStoredToken(res.token);
    setCurrentUser(res.user);
  };

  const registerUser = async (data: any): Promise<UserProfile> => {
    const res = await api.auth.register(data);
    setStoredToken(res.token);
    setCurrentUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.warn('Logout error', err);
    } finally {
      setStoredToken(null);
      setCurrentUser(null);
    }
  };

  const updateUserStatus = async (uid: string, status: AccountStatus, reason?: string) => {
    if (status === 'SUSPENDED') {
      await api.admin.suspendUser(uid, reason || 'Administrative action');
    } else if (status === 'ACTIVE') {
      await api.admin.reactivateUser(uid);
    }
    if (currentUser?.uid === uid) {
      await refreshUser();
    }
  };

  const currentRole: UserRole = currentUser ? currentUser.role : 'PUBLIC';
  const accountStatus: AccountStatus | null = currentUser ? currentUser.accountStatus : null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        accountStatus,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        registerUser,
        logout,
        refreshUser,
        updateUserStatus,
      }}
    >
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
