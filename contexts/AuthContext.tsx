import React, { createContext, useContext, ReactNode, useMemo, useEffect, useState, useCallback } from 'react';
import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { User } from '../types';
import { Loader2, WifiOff } from 'lucide-react';
import { FEATURES } from '../features';

interface AuthContextType {
  user: User | null;
  login: () => void; // Opens Clerk Login or Toggle Demo Login
  logout: () => void;
  hasRole: (role: string) => boolean;
  getToken: () => Promise<string | null>;
  isDemo?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- CLERK AUTH PROVIDER (Standard) ---
export const ClerkAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: clerkUser, isSignedIn, isLoaded } = useUser();
  const { getToken: getClerkToken } = useClerkAuth();
  const { signOut, openSignIn } = useClerk();
  const [showTimeoutError, setShowTimeoutError] = useState(false);

  // Map Clerk User to our App's User Interface
  const user: User | null = useMemo(() => {
    if (!isSignedIn || !clerkUser) return null;

    // We assume roles are stored in publicMetadata.
    const roles = (clerkUser.publicMetadata.roles as string[]) || ['member'];

    return {
      username: clerkUser.username || clerkUser.firstName || 'Member',
      roles: roles
    };
  }, [isSignedIn, clerkUser]);

  // Timeout failsafe - Reduced to 2.5s for fast fallback to Demo Mode
  useEffect(() => {
    let timer: number;
    if (!isLoaded) {
        timer = window.setTimeout(() => {
            if (!isLoaded) {
                setShowTimeoutError(true);
            }
        }, 2500); 
    }
    return () => clearTimeout(timer);
  }, [isLoaded]);

  // Memoize functions to keep context value stable
  const login = useCallback(() => openSignIn(), [openSignIn]);
  const logout = useCallback(() => signOut(), [signOut]);
  
  const hasRole = useCallback((role: string) => {
      return user ? user.roles.includes(role) : false;
  }, [user]);
  
  const getToken = useCallback(async () => {
     if (!isSignedIn) return null;
     try {
         // Try getting the custom token template first, fall back to raw token
         return await getClerkToken({ template: 'neon' }) || await getClerkToken() || null;
     } catch (error) {
         console.warn("AuthContext: Failed to retrieve token (likely during logout)", error);
         return null;
     }
  }, [isSignedIn, getClerkToken]);

  const contextValue = useMemo(() => ({
      user, 
      login, 
      logout, 
      hasRole, 
      getToken, 
      isDemo: false 
  }), [user, login, logout, hasRole, getToken]);

  if (showTimeoutError) {
      // This error triggers the ErrorBoundary in index.tsx
      throw new Error("Clerk Initialization Timeout"); 
  }

  if (!isLoaded) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-[#1a1a2e]">
             <div className="flex flex-col items-center gap-4">
                 <Loader2 className="animate-spin text-[#e94560]" size={48} />
                 <span className="text-gray-400 text-sm tracking-widest uppercase animate-pulse">Initializing Town...</span>
             </div>
        </div>
      );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// --- DEMO AUTH PROVIDER (Fallback) ---
export const DemoAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // State to toggle between Guest and Admin in Demo Mode
    const [user, setUser] = useState<User | null>(null);

    const login = useCallback(() => {
        setUser({
            username: "Demo Steward",
            roles: ['admin', 'steward', 'member']
        });
    }, []);

    const logout = useCallback(() => {
        setUser(null);
    }, []);

    const hasRole = useCallback((role: string) => {
        return user ? user.roles.includes(role) : false;
    }, [user]);

    const getToken = useCallback(async () => "demo-token", []);

    const contextValue = useMemo(() => ({
        user, 
        login, 
        logout, 
        hasRole, 
        getToken, 
        isDemo: true 
    }), [user, login, logout, hasRole, getToken]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
            {/* Only show the warning banner if we EXPECTED Clerk to be on, but fell back to Demo */}
            {FEATURES.ENABLE_CLERK_AUTH && (
                <div className="fixed bottom-0 left-0 w-full bg-amber-600/90 backdrop-blur text-white text-center text-[10px] py-1 z-[9999] font-mono flex items-center justify-center gap-2">
                    <WifiOff size={12} />
                    <span>OFFLINE DEMO MODE — {user ? 'Admin Access' : 'Guest Access'} (Clerk Key Missing or Error)</span>
                </div>
            )}
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