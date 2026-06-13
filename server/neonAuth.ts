import { createRemoteJWKSet, decodeJwt, decodeProtectedHeader, jwtVerify } from 'jose';
import { hasNeonAuthConfig, serverConfig } from './config.js';

const authUrl = hasNeonAuthConfig ? new URL(serverConfig.neonAuthUrl!) : undefined;
const authIssuer = authUrl?.toString().replace(/\/$/, '');
const allowedIssuers = authUrl ? [authUrl.origin, authIssuer!] : undefined;
const jwksUrl = serverConfig.neonAuthJwksUrl
  || (authUrl ? `${authUrl.toString().replace(/\/$/, '')}/.well-known/jwks.json` : undefined);
const jwks = jwksUrl
  ? createRemoteJWKSet(new URL(jwksUrl))
  : undefined;

export interface VerifiedNeonUser {
  id: string;
  email?: string;
  name?: string;
}

export const verifyNeonAccessToken = async (token: string): Promise<VerifiedNeonUser | null> => {
  if (!jwks || !allowedIssuers) return null;

  try {
    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ['EdDSA'],
      issuer: allowedIssuers,
    });

    if (payload.role === 'anonymous' || payload.sub === 'anonymous') return null;

    const id = typeof payload.sub === 'string'
      ? payload.sub
      : typeof payload.id === 'string'
        ? payload.id
        : undefined;

    if (!id) return null;
    return {
      id,
      ...(typeof payload.email === 'string' ? { email: payload.email } : {}),
      ...(typeof payload.name === 'string' ? { name: payload.name } : {}),
    };
  } catch (error) {
    try {
      const payload = decodeJwt(token);
      const header = decodeProtectedHeader(token);
      console.warn('Neon token verification failed.', {
        code: error instanceof Error && 'code' in error ? String(error.code) : 'UNKNOWN',
        message: error instanceof Error ? error.message : 'Unknown verification error',
        algorithm: header.alg,
        issuer: payload.iss,
        audience: payload.aud,
        role: payload.role,
        expired: typeof payload.exp === 'number' ? payload.exp * 1000 <= Date.now() : undefined,
      });
    } catch {
      console.warn('Neon token verification failed: malformed token.');
    }
    return null;
  }
};
