import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import multer from 'multer';
import { hasCloudinaryConfig, hasDatabaseConfig, hasNeonAuthConfig, isTrustedOrigin, serverConfig } from './config.js';
import { verifyNeonAccessToken } from './neonAuth.js';
import { ImageUploadError, ImageValidationError, imageService, maxImageSize } from './services/imageService.js';
import { JournalValidationError, journalService } from './services/journalService.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", ...(hasNeonAuthConfig ? [new URL(serverConfig.neonAuthUrl!).origin] : [])],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));

app.use(express.json({ limit: '8mb' }));

app.get('/api/status', (_req, res) => {
  res.json({
    authConfigured: hasNeonAuthConfig,
    databaseConfigured: hasDatabaseConfig,
    cloudinaryConfigured: hasCloudinaryConfig,
  });
});

const requireSession = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!hasNeonAuthConfig) {
    res.status(503).json({ error: 'Authentication is not configured.' });
    return;
  }

  const authorization = req.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Sign in is required.' });
    return;
  }

  const user = await verifyNeonAccessToken(token);
  if (!user) {
    res.status(401).json({ error: 'Your session could not be verified.' });
    return;
  }

  res.locals.user = user;
  next();
};

const requireSameOrigin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const origin = req.get('origin');
  if (origin && !isTrustedOrigin(origin)) {
    res.status(403).json({ error: 'Cross-origin write request rejected.' });
    return;
  }
  next();
};

app.get('/api/journal', requireSession, async (_req, res) => {
  if (!journalService) {
    res.status(503).json({ error: 'Database is not configured.' });
    return;
  }

  const journal = await journalService.getForUser(res.locals.user.id);
  res.json(journal);
});

app.put('/api/journal', requireSameOrigin, requireSession, async (req, res) => {
  if (!journalService) {
    res.status(503).json({ error: 'Database is not configured.' });
    return;
  }

  try {
    await journalService.replaceForUser(res.locals.user.id, req.body.games);
    res.status(204).end();
  } catch (error) {
    if (error instanceof JournalValidationError) {
      res.status(400).json({ error: error.message, details: error.details });
      return;
    }
    throw error;
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxImageSize, files: 1 },
});

app.post('/api/uploads/image', requireSameOrigin, requireSession, upload.single('image'), async (req, res) => {
  if (!imageService) {
    res.status(503).json({ error: 'Cloudinary is not configured.' });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: 'Choose an image to upload.' });
    return;
  }

  try {
    const uploaded = await imageService.upload({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      size: req.file.size,
      userId: res.locals.user.id,
    });
    res.status(201).json(uploaded);
  } catch (error) {
    if (error instanceof ImageValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof ImageUploadError) {
      res.status(502).json({ error: error.message });
      return;
    }
    throw error;
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    res.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Image must be 8 MB or smaller.' : error.message });
    return;
  }
  console.error('Unexpected API error.', error);
  res.status(500).json({ error: 'Unexpected server error.' });
});

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(currentDir, '..', 'dist');
app.use(express.static(distDir));
app.get('/{*splat}', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));

(journalService?.initialize() ?? Promise.resolve())
  .then(() => {
    app.listen(serverConfig.port, () => {
      console.log(`LorePlay API listening on http://127.0.0.1:${serverConfig.port}`);
      if (!hasDatabaseConfig) console.log('Neon is not configured; guest local mode remains available.');
      if (!hasNeonAuthConfig) console.log('Neon Auth is not configured; sign in remains disabled.');
      if (!hasCloudinaryConfig) console.log('Cloudinary is not configured; image uploads remain disabled.');
    });
  })
  .catch((error) => {
    console.error('Failed to initialize the database schema.', error);
    process.exitCode = 1;
  });
