# Neon and Cloudinary setup

LorePlay works without any account. In guest mode, journal data stays in the current browser's `localStorage`.

When a user signs in, LorePlay loads and saves that user's journal through the authenticated API backed by Neon PostgreSQL. Cloudinary uploads are also restricted to authenticated users.

## 1. Finish Neon CLI onboarding

Run this in the project root and complete the editor selection and browser login:

```powershell
npx neonctl@latest init
```

The command installs Neon editor tooling and agent skills. Restart the editor after it completes.

## 2. Create the Neon database

1. Create a Neon project in the Neon Console.
2. Copy the pooled PostgreSQL connection string.
3. Put it in `.env` as `DATABASE_URL`.
4. Generate a Better Auth secret:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

5. Put the generated value in `.env` as `BETTER_AUTH_SECRET`.
6. Create the authentication tables:

```powershell
npm run auth:migrate
```

The `journal_documents` table is created automatically when the API starts. Its SQL is also available in `database/journal.sql`.

## 3. Configure Cloudinary

1. Create or open a Cloudinary account.
2. Open the Cloudinary Console and go to **API Keys**.
3. Copy the cloud name, API key, and API secret into `.env`:

```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Do not prefix the API secret with `VITE_`. Any `VITE_` variable is bundled into browser code and is public.

LorePlay uploads through the authenticated server endpoint. No unsigned upload preset is required.

## 4. Start LorePlay

```powershell
npm run dev
```

The Vite frontend runs on `http://localhost:5173` and proxies `/api` to the API server on port `3001`.

## Data behavior

- Signed out: data is loaded from and saved to local browser storage.
- Signed in: data is loaded from and saved to the current user's Neon journal.
- Signing out restores the untouched guest journal from local storage.
- Full-profile import requires two confirmations plus typing `OVERWRITE`.
- A safety backup is downloaded before destructive imports.
