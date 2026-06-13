import 'dotenv/config';

const readOptional = (name: string) => process.env[name]?.trim() || undefined;
const appOrigin = readOptional('APP_ORIGIN') || 'http://localhost:5173';

export const serverConfig = {
  port: Number(readOptional('PORT') || 3001),
  appOrigin,
  databaseUrl: readOptional('DATABASE_URL'),
  neonAuthUrl: readOptional('VITE_NEON_AUTH_URL'),
  neonAuthJwksUrl: readOptional('NEON_AUTH_JWKS_URL'),
  cloudinary: {
    cloudName: readOptional('CLOUDINARY_CLOUD_NAME'),
    apiKey: readOptional('CLOUDINARY_API_KEY'),
    apiSecret: readOptional('CLOUDINARY_API_SECRET'),
  },
};

export const isTrustedOrigin = (origin: string) => {
  if (origin === serverConfig.appOrigin) return true;
  if (process.env.NODE_ENV === 'production') return false;

  try {
    const url = new URL(origin);
    const isLoopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]';
    return url.protocol === 'http:' && isLoopback;
  } catch {
    return false;
  }
};

export const hasDatabaseConfig = Boolean(serverConfig.databaseUrl);

export const hasNeonAuthConfig = (() => {
  if (!serverConfig.neonAuthUrl) return false;
  try {
    const url = new URL(serverConfig.neonAuthUrl);
    return url.protocol === 'https:' || (process.env.NODE_ENV !== 'production' && url.hostname === 'localhost');
  } catch {
    return false;
  }
})();

export const hasCloudinaryConfig = Boolean(
  serverConfig.cloudinary.cloudName
  && serverConfig.cloudinary.apiKey
  && serverConfig.cloudinary.apiSecret
);
