import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v2 as cloudinary } from 'cloudinary';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import multer from 'multer';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';
import { hasCloudinaryConfig, hasDatabaseConfig, isTrustedOrigin, serverConfig } from './config.js';
import { ensureJournalSchema, pool } from './database.js';
import { journalSchema } from '../src/services/journalValidation.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: 'draft-8', legacyHeaders: false });

if (auth) {
  app.all('/api/auth/*splat', authLimiter, toNodeHandler(auth));
} else {
  app.all('/api/auth/*splat', (_req, res) => {
    res.status(503).json({ error: 'Authentication is not configured. Add Neon credentials to .env.' });
  });
}

app.use(express.json({ limit: '8mb' }));

app.get('/api/status', (_req, res) => {
  res.json({
    databaseConfigured: hasDatabaseConfig,
    cloudinaryConfigured: hasCloudinaryConfig,
  });
});

const requireSession = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!auth) {
    res.status(503).json({ error: 'Authentication is not configured.' });
    return;
  }

  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session?.user) {
      res.status(401).json({ error: 'Sign in is required.' });
      return;
    }

    res.locals.user = session.user;
    next();
  } catch {
    res.status(401).json({ error: 'Your session could not be verified.' });
  }
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
  if (!pool) {
    res.status(503).json({ error: 'Database is not configured.' });
    return;
  }

  const result = await pool.query('SELECT data, updated_at FROM journal_documents WHERE user_id = $1', [res.locals.user.id]);
  res.json({ games: result.rows[0]?.data || [], updatedAt: result.rows[0]?.updated_at || null });
});

app.put('/api/journal', requireSameOrigin, requireSession, async (req, res) => {
  if (!pool) {
    res.status(503).json({ error: 'Database is not configured.' });
    return;
  }

  const parsed = journalSchema.safeParse(req.body.games);
  if (!parsed.success) {
    res.status(400).json({ error: 'Journal data is invalid.', details: parsed.error.flatten() });
    return;
  }

  await pool.query(
    `INSERT INTO journal_documents (user_id, data, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [res.locals.user.id, JSON.stringify(parsed.data)]
  );
  res.status(204).end();
});

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: serverConfig.cloudinary.cloudName!,
    api_key: serverConfig.cloudinary.apiKey!,
    api_secret: serverConfig.cloudinary.apiSecret!,
    secure: true,
  });
}

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowed = allowedImageTypes.has(file.mimetype);
    if (allowed) callback(null, true);
    else callback(new Error('Unsupported image type.'));
  },
});

app.post('/api/uploads/image', requireSameOrigin, requireSession, upload.single('image'), async (req, res) => {
  if (!hasCloudinaryConfig) {
    res.status(503).json({ error: 'Cloudinary is not configured.' });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: 'Choose an image to upload.' });
    return;
  }

  try {
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: `loreplay/${String(res.locals.user.id).replace(/[^a-zA-Z0-9_-]/g, '_')}`,
          unique_filename: true,
          overwrite: false,
        },
        (error, uploaded) => {
          if (error || !uploaded) reject(error || new Error('Upload failed.'));
          else resolve({ secure_url: uploaded.secure_url, public_id: uploaded.public_id });
        }
      );
      stream.end(req.file?.buffer);
    });

    res.status(201).json({ url: result.secure_url, publicId: result.public_id });
  } catch {
    res.status(502).json({ error: 'Cloudinary upload failed.' });
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    res.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Image must be 8 MB or smaller.' : error.message });
    return;
  }
  if (error instanceof Error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.status(500).json({ error: 'Unexpected server error.' });
});

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(currentDir, '..', 'dist');
app.use(express.static(distDir));
app.get('/{*splat}', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));

ensureJournalSchema()
  .then(() => {
    app.listen(serverConfig.port, () => {
      console.log(`LorePlay API listening on http://127.0.0.1:${serverConfig.port}`);
      if (!hasDatabaseConfig) console.log('Neon is not configured; guest local mode remains available.');
      if (!hasCloudinaryConfig) console.log('Cloudinary is not configured; image uploads remain disabled.');
    });
  })
  .catch((error) => {
    console.error('Failed to initialize the database schema.', error);
    process.exitCode = 1;
  });
