import { betterAuth } from 'better-auth';
import { pool } from './database.js';
import { hasDatabaseConfig, isTrustedOrigin, serverConfig } from './config.js';

export const auth = pool && hasDatabaseConfig
  ? betterAuth({
      database: pool,
      secret: serverConfig.authSecret,
      baseURL: serverConfig.appOrigin,
      trustedOrigins: async (request) => {
        const requestOrigin = request?.headers.get('origin');
        return [
          serverConfig.appOrigin,
          requestOrigin && isTrustedOrigin(requestOrigin) ? requestOrigin : undefined,
        ];
      },
      emailAndPassword: {
        enabled: true,
        minPasswordLength: 10,
        maxPasswordLength: 128,
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
      },
      advanced: {
        useSecureCookies: serverConfig.appOrigin.startsWith('https://'),
      },
    })
  : undefined;
