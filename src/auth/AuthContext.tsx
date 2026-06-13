import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authClient } from '../services/authClient';

interface AppCapabilities {
  databaseConfigured: boolean;
  cloudinaryConfigured: boolean;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isPending: boolean;
  capabilities: AppCapabilities;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (name: string, email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const session = authClient.useSession();
  const [capabilities, setCapabilities] = useState<AppCapabilities>({
    databaseConfigured: false,
    cloudinaryConfigured: false,
  });

  useEffect(() => {
    const refreshCapabilities = () => {
      fetch('/api/status')
        .then((response) => response.ok ? response.json() : Promise.reject())
        .then((data: AppCapabilities) => setCapabilities(data))
        .catch(() => setCapabilities({ databaseConfigured: false, cloudinaryConfigured: false }));
    };

    refreshCapabilities();
    const intervalId = window.setInterval(refreshCapabilities, 15_000);
    window.addEventListener('focus', refreshCapabilities);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshCapabilities);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session.data?.user ? {
      id: session.data.user.id,
      name: session.data.user.name,
      email: session.data.user.email,
      image: session.data.user.image ?? null,
    } : null,
    isPending: session.isPending,
    capabilities,
    signIn: async (email, password) => {
      const result = await authClient.signIn.email({ email, password, rememberMe: true });
      if (result.error) return result.error.message || 'Sign in failed.';
      await session.refetch();
      return null;
    },
    signUp: async (name, email, password) => {
      const result = await authClient.signUp.email({ name, email, password });
      if (result.error) return result.error.message || 'Account creation failed.';
      await session.refetch();
      return null;
    },
    signOut: async () => {
      await authClient.signOut();
      await session.refetch();
    },
  }), [capabilities, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
