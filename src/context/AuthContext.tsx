import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, AccountStatus } from '../types/roles';
import { SEED_USERS } from '../data/seedData';

interface AuthContextType {
  currentUser: UserProfile | null;
  currentRole: UserRole;
  accountStatus: AccountStatus | null;
  isAuthenticated: boolean;
  switchUser: (uid: string) => void;
  switchRolePersona: (preset: 'PUBLIC' | 'BUYER' | 'SELLER_ACTIVE' | 'SELLER_PENDING' | 'DEVELOPER_ACTIVE' | 'DEVELOPER_PENDING' | 'ADMIN') => void;
  registerUser: (data: {
    role: 'BUYER' | 'SELLER' | 'DEVELOPER';
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    state?: string;
    city?: string;
    sellerRelationship?: 'OWNER' | 'REPRESENTATIVE';
    companyName?: string;
    cacNumber?: string;
  }) => UserProfile;
  users: UserProfile[];
  updateUserStatus: (uid: string, status: AccountStatus, reason?: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_AUTH = 'realto_auth_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('realto_users_list');
    return saved ? JSON.parse(saved) : SEED_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const savedUid = localStorage.getItem(STORAGE_KEY_AUTH);
    if (savedUid === 'public') return null;
    const found = users.find((u) => u.uid === (savedUid || 'buyer-1'));
    return found || users[1]; // default to buyer-1
  });

  useEffect(() => {
    localStorage.setItem('realto_users_list', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_AUTH, currentUser.uid);
    } else {
      localStorage.setItem(STORAGE_KEY_AUTH, 'public');
    }
  }, [currentUser]);

  const switchUser = (uid: string) => {
    if (uid === 'public') {
      setCurrentUser(null);
      return;
    }
    const found = users.find((u) => u.uid === uid);
    if (found) {
      setCurrentUser(found);
    }
  };

  const switchRolePersona = (
    preset:
      | 'PUBLIC'
      | 'BUYER'
      | 'SELLER_ACTIVE'
      | 'SELLER_PENDING'
      | 'DEVELOPER_ACTIVE'
      | 'DEVELOPER_PENDING'
      | 'ADMIN'
  ) => {
    switch (preset) {
      case 'PUBLIC':
        setCurrentUser(null);
        break;
      case 'BUYER':
        switchUser('buyer-1');
        break;
      case 'SELLER_ACTIVE':
        switchUser('seller-1');
        break;
      case 'SELLER_PENDING':
        switchUser('seller-pending');
        break;
      case 'DEVELOPER_ACTIVE':
        switchUser('dev-user-1');
        break;
      case 'DEVELOPER_PENDING':
        switchUser('dev-user-pending');
        break;
      case 'ADMIN':
        switchUser('admin-1');
        break;
    }
  };

  const registerUser = (data: {
    role: 'BUYER' | 'SELLER' | 'DEVELOPER';
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    state?: string;
    city?: string;
    sellerRelationship?: 'OWNER' | 'REPRESENTATIVE';
    companyName?: string;
    cacNumber?: string;
  }): UserProfile => {
    const uid = `user-${Date.now()}`;
    const initialStatus: AccountStatus =
      data.role === 'BUYER' ? 'ACTIVE' : 'PENDING_APPROVAL';

    const newUser: UserProfile = {
      uid,
      role: data.role,
      accountStatus: initialStatus,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      state: data.state || 'Lagos',
      city: data.city || 'Lagos',
      sellerRelationship: data.sellerRelationship,
      developerId: data.role === 'DEVELOPER' ? `dev-${Date.now()}` : undefined,
      kycStatus: data.role !== 'BUYER' ? 'SUBMITTED' : undefined,
      kycDocumentName: data.role !== 'BUYER' ? 'verification_doc_upload.pdf' : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    // Immediately log in so they can access their dashboard!
    setCurrentUser(newUser);
    return newUser;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates, updatedAt: new Date().toISOString() };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.uid === updated.uid ? updated : u)));
  };

  const updateUserStatus = (uid: string, status: AccountStatus, reason?: string) => {
    const now = new Date().toISOString();
    setUsers((prev) =>
      prev.map((u) => {
        if (u.uid === uid) {
          return {
            ...u,
            accountStatus: status,
            statusReason: reason,
            updatedAt: now,
          };
        }
        return u;
      })
    );

    if (currentUser?.uid === uid) {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              accountStatus: status,
              statusReason: reason,
              updatedAt: now,
            }
          : null
      );
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole: currentUser ? currentUser.role : 'PUBLIC',
        accountStatus: currentUser ? currentUser.accountStatus : null,
        isAuthenticated: !!currentUser,
        switchUser,
        switchRolePersona,
        registerUser,
        users,
        updateUserStatus,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
