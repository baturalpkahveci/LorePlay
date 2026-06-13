import { hasCloudinaryConfig, hasDatabaseConfig, hasNeonAuthConfig, serverConfig } from '../../server/config.js';
import { verifyNeonAccessToken, type VerifiedNeonUser } from '../../server/neonAuth.js';
import { ImageUploadError, ImageValidationError, imageService } from '../../server/services/imageService.js';
import { JournalValidationError, journalService } from '../../server/services/journalService.js';

const json = (body: unknown, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store' },
});

const getUser = async (request: Request): Promise<VerifiedNeonUser | null> => {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  return token ? verifyNeonAccessToken(token) : null;
};

const isTrustedWrite = (request: Request) => {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  const requestOrigin = new URL(request.url).origin;
  const configuredOrigins = [serverConfig.appOrigin, process.env.URL].filter(Boolean);
  return origin === requestOrigin || configuredOrigins.includes(origin);
};

export default async (request: Request) => {
  const pathname = new URL(request.url).pathname;

  if (pathname.endsWith('/status') && request.method === 'GET') {
    return json({
      authConfigured: hasNeonAuthConfig,
      databaseConfigured: hasDatabaseConfig,
      cloudinaryConfigured: hasCloudinaryConfig,
    });
  }

  if (!isTrustedWrite(request) && request.method !== 'GET') {
    return json({ error: 'Cross-origin write request rejected.' }, 403);
  }

  const user = await getUser(request);
  if (!user) return json({ error: 'Your session could not be verified.' }, 401);

  if (pathname.endsWith('/journal')) {
    if (!journalService) return json({ error: 'Database is not configured.' }, 503);

    if (request.method === 'GET') {
      const journal = await journalService.getForUser(user.id);
      return json(journal);
    }

    if (request.method === 'PUT') {
      const body = await request.json().catch(() => null) as { games?: unknown } | null;
      try {
        await journalService.replaceForUser(user.id, body?.games);
        return new Response(null, { status: 204 });
      } catch (error) {
        if (error instanceof JournalValidationError) {
          return json({ error: error.message, details: error.details }, 400);
        }
        throw error;
      }
    }

    return json({ error: 'Method not allowed.' }, 405);
  }

  if (pathname.endsWith('/uploads/image') && request.method === 'POST') {
    if (!imageService) return json({ error: 'Cloudinary is not configured.' }, 503);

    const formData = await request.formData().catch(() => null);
    const image = formData?.get('image');
    if (!(image instanceof File)) return json({ error: 'Choose an image to upload.' }, 400);

    try {
      const uploaded = await imageService.upload({
        buffer: Buffer.from(await image.arrayBuffer()),
        mimeType: image.type,
        size: image.size,
        userId: user.id,
      });
      return json(uploaded, 201);
    } catch (error) {
      if (error instanceof ImageValidationError) return json({ error: error.message }, 400);
      if (error instanceof ImageUploadError) return json({ error: error.message }, 502);
      throw error;
    }
  }

  return json({ error: 'API route not found.' }, 404);
};
