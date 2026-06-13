import { createAuthClient } from '@neondatabase/neon-js/auth';

export const neonAuthUrl = import.meta.env.VITE_NEON_AUTH_URL?.trim() || '';
export const isNeonAuthConfigured = Boolean(neonAuthUrl);

// Keep the client constructible in guest-only mode. Auth actions remain disabled
// until a real Neon Auth URL is supplied through VITE_NEON_AUTH_URL.
export const authClient = createAuthClient(
  neonAuthUrl || `${window.location.origin}/__neon-auth-not-configured`,
);
