import React, { createContext, useContext, ReactNode, useMemo, useState, useCallback } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: () => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  getToken: () => Promise<string | null>;
  isDemo?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- AUTH PROVIDER (Local / Custom) ---
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Simple local state for user
    const [user, setUser] = useState<User | null>(null);

    const login = useCallback(() => {
        // Simulating a login as Admin/Steward
        setUser({
            username: "Town Steward",
            roles: ['admin', 'steward', 'member']
        });
    }, []);

    const logout = useCallback(() => {
        setUser(null);
    }, []);

    const hasRole = useCallback((role: string) => {
        return user ? user.roles.includes(role) : false;
    }, [user]);

    const getToken = useCallback(async () => "mock-token", []);

    const contextValue = useMemo(() => ({
        user, 
        login, 
        logout, 
        hasRole, 
        getToken,
        isDemo: true // System effectively behaves as a demo/local instance
    }), [user, login, logout, hasRole, getToken]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};