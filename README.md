<div align="center">
  <img src="public/loreplay_icon.svg" alt="LorePlay logo" width="112" height="112" />
  <h1>LorePlay</h1>
  <p>A local-first game journal where you can keep your games, playthroughs, and game notes in one place.</p>
</div>

## About the Project

LorePlay is a web application developed to help you organize the games you play, different save/playthrough series, and the notes related to those series. When used without an account, data is stored only in the browser. When signed in with Neon Auth, the user’s journal is stored on Neon PostgreSQL and synchronized across devices.

Note descriptions support Markdown. Direct image URLs, Steam screenshot links, and resizable Markdown images can be displayed inside note content.

## Features

- Game, playthrough, and note management
- Cover images for games and notes
- List and compact card views
- Search, filtering, and advanced sorting options
- Markdown-supported note content
- Inline and resizable images inside text
- Note tags, colors, and date information
- Playthrough statuses and streak statistics
- localStorage support for account-free usage
- Registration, login, logout, and password reset with Neon Auth
- User-specific cloud journal with Neon PostgreSQL
- Secure image uploads with Cloudinary
- JSON import/export at profile, game, and playthrough levels
- Backup file names including date and time
- Multi-step confirmation and automatic safety backup before import
- Responsive, dark-themed interface

## Data Model

```text
Game
└── Playthrough
    └── Note
```

A game can have multiple playthroughs, and each playthrough can contain multiple notes. In cloud mode, the entire journal is stored as a single user document inside Neon PostgreSQL.

## Technologies

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- React Router
- React Markdown, Remark GFM, and Rehype
- Lucide React

### Backend and Cloud

- Express for local development and standalone server usage
- Netlify Functions for the production API
- Neon PostgreSQL
- Neon Auth
- Cloudinary
- JWT verification with JOSE/JWKS
- Data validation with Zod

## Architecture

```text
React UI
  ↓
Client services / repositories
  ↓ HTTP
Express API or Netlify Function
  ↓
Server services
  ↓
Neon repositories / Cloudinary
```

Important folders:

```text
src/
  components/       UI components
  pages/            Pages
  services/         Browser API and auth clients
  store/            Journal state management

server/
  repositories/     Neon SQL access
  services/         Journal and image use cases
  index.ts          Local Express HTTP adapter

netlify/functions/
  api.mts           Netlify HTTP adapter
```

Express and Netlify Function use the same server service and repository layers. This prevents SQL queries from being duplicated inside route files.

## Local Setup

Requirements:

- Latest Node.js LTS
- npm
- Neon and Cloudinary accounts if cloud features will be used

Install the project:

```bash
git clone https://github.com/baturalpkahveci/LorePlay.git
cd game-journal-app
npm install
```

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://...
APP_ORIGIN=http://localhost:5173
VITE_NEON_AUTH_URL=https://.../auth
NEON_AUTH_JWKS_URL=https://.../.well-known/jwks.json
PORT=3001

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Start the development servers:

```bash
npm run dev
```

The frontend runs at `http://localhost:5173` by default, while the Express API runs at `http://localhost:3001`.

Without cloud environment variables, the application can be used in local mode without requiring an account.

## Commands

| Command           | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `npm run dev`     | Starts the Vite and Express development servers together |
| `npm run dev:web` | Starts only the Vite frontend                            |
| `npm run dev:api` | Starts only the Express API                              |
| `npm run build`   | Creates the production frontend build                    |
| `npm run lint`    | Runs ESLint checks                                       |
| `npm run start`   | Starts the Express production server                     |

TypeScript check:

```bash
npx tsc --noEmit
```

## Neon Setup

1. Enable the Auth feature in your Neon project.
2. Add the Auth Base URL as `VITE_NEON_AUTH_URL`.
3. Add the JWKS URL as `NEON_AUTH_JWKS_URL`.
4. Add local and production origins to the Neon Auth allowed domains list.
5. Configure the Neon Email Provider section for password reset emails.
6. Add the PostgreSQL connection string as `DATABASE_URL`.

`VITE_NEON_AUTH_URL` is a public frontend configuration value. `DATABASE_URL` and the Cloudinary secret must never be defined with the `VITE_` prefix.

## Netlify Deployment

The repository is prepared for Netlify deployment with `netlify.toml` and `netlify/functions/api.mts`.

Environment variable scopes:

| Variable                | Scope                |
| ----------------------- | -------------------- |
| `VITE_NEON_AUTH_URL`    | Builds and Functions |
| `DATABASE_URL`          | Functions            |
| `NEON_AUTH_JWKS_URL`    | Functions            |
| `CLOUDINARY_CLOUD_NAME` | Functions            |
| `CLOUDINARY_API_KEY`    | Functions            |
| `CLOUDINARY_API_SECRET` | Functions            |
| `APP_ORIGIN`            | Functions            |

`APP_ORIGIN` must be the full origin of the published site:

```text
https://your-site.netlify.app
```

The same address must also be added to the Neon Auth allowed domains list. After changing environment variables, a new production deploy must be triggered.

## Security

- Database and Cloudinary secret values are used only in the backend environment.
- Cloud API requests are authenticated with Neon JWT.
- JWT signatures are verified through Neon JWKS keys.
- Journal records are separated by authenticated user identity.
- SQL queries are executed with parameters.
- Imported journal data is validated with Zod schemas.
- Markdown output is sanitized.
- Image type and file size are checked again on the backend.
- Cross-origin write requests are rejected.

## Backup and Import

LorePlay can create JSON backups at profile, game, and playthrough levels. Backup files include the local date and time:

```text
loreplay-backup-2026-06-14_18-30-00.json
loreplay-game-example-backup-2026-06-14_18-30-00.json
```

To prevent data loss, destructive import operations require multiple confirmations and automatically download a safety backup of the existing data.

## Storage Modes

### Local Mode

- No account is required.
- Data is stored only in the localStorage area of the browser being used.
- It is not automatically transferred to other devices.

### Cloud Mode

- Requires a Neon Auth account.
- The journal is stored on Neon PostgreSQL according to the user identity.
- Cloudinary upload features can be used.
- It can be accessed from different devices with the same account.

## License

This project is proprietary and provided for portfolio purposes only.

All rights reserved. You may not copy, modify, distribute, or use this project or any part of it without explicit written permission from the author.
