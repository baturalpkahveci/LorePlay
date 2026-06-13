import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authClient, isNeonAuthConfigured } from '../services/authClient';

interface AppCapabilities {
  authConfigured: boolean;
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
  requestPasswordReset: (email: string) => Promise<string | null>;
  resetPassword: (token: string, newPassword: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isPending, setIsPending] = useState(isNeonAuthConfigured);
  const [capabilities, setCapabilities] = useState<AppCapabilities>({
    authConfigured: isNeonAuthConfigured,
    databaseConfigured: false,
    cloudinaryConfigured: false,
  });

  const refreshSession = useCallback(async () => {
    if (!isNeonAuthConfigured) {
      setUser(null);
      setIsPending(false);
      return;
    }

    try {
      const result = await authClient.getSession();
      const sessionUser = result.data?.user;
      setUser(sessionUser ? {
        id: sessionUser.id,
        name: sessionUser.name || sessionUser.email.split('@')[0] || 'User',
        email: sessionUser.email,
        image: sessionUser.image ?? null,
      } : null);
    } catch {
      setUser(null);
    } finally {
      setIsPending(false);
    }
  }, []);

  useEffect(() => {
    const refreshCapabilities = () => {
      fetch('/api/status')
        .then((response) => response.ok ? response.json() : Promise.reject())
        .then((data: AppCapabilities) => setCapabilities(data))
        .catch(() => setCapabilities({ authConfigured: isNeonAuthConfigured, databaseConfigured: false, cloudinaryConfigured: false }));
    };

    refreshCapabilities();
    const intervalId = window.setInterval(refreshCapabilities, 15_000);
    window.addEventListener('focus', refreshCapabilities);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshCapabilities);
    };
  }, []);

  useEffect(() => {
    void refreshSession();
    window.addEventListener('focus', refreshSession);
    return () => window.removeEventListener('focus', refreshSession);
  }, [refreshSession]);

  const errorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isPending,
    capabilities,
    signIn: async (email, password) => {
      if (!isNeonAuthConfigured) return 'Neon Auth is not configured.';
      try {
        const result = await authClient.signIn.email({ email, password, rememberMe: true });
        if (result.error) return result.error.message || 'Sign in failed.';
        await refreshSession();
        return null;
      } catch (error) {
        return errorMessage(error, 'Sign in failed.');
      }
    },
    signUp: async (name, email, password) => {
      if (!isNeonAuthConfigured) return 'Neon Auth is not configured.';
      try {
        const result = await authClient.signUp.email({ name, email, password });
        if (result.error) return result.error.message || 'Account creation failed.';
        await refreshSession();
        return null;
      } catch (error) {
        return errorMessage(error, 'Account creation failed.');
      }
    },
    requestPasswordReset: async (email) => {
      if (!isNeonAuthConfigured) return 'Neon Auth is not configured.';
      try {
        const result = await authClient.requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        });
        return result.error ? result.error.message || 'Password reset request failed.' : null;
      } catch (error) {
        return errorMessage(error, 'Password reset request failed.');
      }
    },
    resetPassword: async (token, newPassword) => {
      if (!isNeonAuthConfigured) return 'Neon Auth is not configured.';
      try {
        const result = await authClient.resetPassword({ token, newPassword });
        return result.error ? result.error.message || 'Password reset failed.' : null;
      } catch (error) {
        return errorMessage(error, 'Password reset failed.');
      }
    },
    signOut: async () => {
      await authClient.signOut();
      setUser(null);
    },
  }), [capabilities, isPending, refreshSession, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
