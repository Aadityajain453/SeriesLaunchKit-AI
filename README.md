# SeriesLaunchKit AI

A MERN SaaS web app for planning, writing and generating AI video series.

- **Frontend:** React 18 + Vite, React Router, React-Bootstrap, Axios, React Icons (`/frontend`)
- **Backend:** Node.js + Express REST API, MongoDB + Mongoose (`/backend`)
- **Auth:** bcrypt-hashed passwords, JWT stored in an **httpOnly cookie**, protected routes, rate-limited login and signup
- **AI:** Anthropic Claude for text (series plans, scripts, prompt enhancement) and KIE.ai Veo 3.1 for text-to-video. Both are called **only from the backend**.

## Features

| Area | What it does |
|---|---|
| Login / Signup | The first screen is Login. It has validation, show/hide password, a loading state, error/success messages, duplicate-email checks and bcrypt hashing. |
| Dashboard | Shows real per-user counts: series, projects, videos, AI generations, PDF exports and credits. Also has account details, recent activity, recent project cards and a Create New / Try Now button. |
| Sidebar | Dashboard, Film Studio, Series Studio, My Projects, My Videos, Gen History, Training, Bonuses and Logout. It collapses on desktop, works off-canvas on mobile, and highlights the active item. |
| Film Studio | Prompt, description, resolution, aspect ratio, optional project, and AI prompt enhancement. Shows live progress while a video renders, then a preview, download and recent history. |
| Series Studio | A dynamic brief form. AI generates the logline, synopsis, characters, episodes (hook, beats, video prompt) and a marketing kit. You can edit episodes, have AI write scripts, send any episode to Film Studio, export a PDF series bible, and regenerate. |
| My Projects | Create, edit, search, filter and delete projects. Every series automatically gets a project. |
| My Videos | Library with status filter, auto-refresh while rendering, download and delete. |
| Gen History | Every AI call with input/output, model, credits used and failure reason. Paginated. |
| Training / Bonuses | Content is served from `backend/src/content/*.js`. Edit those files to change it. |
| Credits | Charged atomically before each AI action and **refunded automatically on failure**. Costs are set in `.env`. |
| Notifications | Welcome message, video ready / failed, series failed. |

The app never shows fake results. If an API key is missing, the UI says so and disables generation. Videos are only marked "completed" when the provider returns a real file URL.

## Quick start (local)

Requirements: Node 18.17+ and MongoDB (local install, Docker, or Atlas).

```bash
# 1. API
cd backend
cp .env.example .env        # fill MONGO_URI, JWT_SECRET, ANTHROPIC_API_KEY, KIE_API_KEY
npm install
npm run dev                  # http://localhost:5000/api

# 2. Web app (new terminal)
cd frontend
npm install
npm run dev                  # http://localhost:5173
```

In development, Vite proxies `/api` to `localhost:5000`, so the auth cookie stays same-origin. No CORS setup is needed.

MongoDB with Docker: `docker run -d -p 27017:27017 --name slk-mongo mongo:7`

## Environment variables (`backend/.env`)

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string (**required**) |
| `JWT_SECRET` | Long random string, 32+ chars in production (**required**) |
| `CLIENT_ORIGIN` | Comma-separated allowed frontend origins |
| `COOKIE_SAMESITE` / `COOKIE_SECURE` | `lax`/`false` locally. Use `none`/`true` when the frontend and API are on different domains (HTTPS). |
| `SIGNUP_CREDITS`, `COST_*` | Starting credits and the cost of each action |
| `ANTHROPIC_API_KEY`, `CLAUDE_MODEL` | Claude text generation |
| `VIDEO_PROVIDER` (`kie`), `KIE_API_KEY`, `KIE_VIDEO_MODEL` | Text-to-video (`veo3_fast` or `veo3`) |

Frontend (`frontend/.env`): `VITE_API_URL` is only needed in production when the API runs on another domain, e.g. `https://api.example.com/api`.

## Series Studio fields

All Series Studio form fields are defined in **one file**: `backend/src/config/seriesFields.js`.
The form, server-side validation, AI prompt and PDF export are all generated from that list. To match the Product Development PDF, add, remove or rename entries there. Nothing else needs to change.

## Adding another video provider

Copy `backend/src/services/video/kieProvider.js` and implement `capabilities`, `isConfigured()`, `createTask()` and `getTask()`. Register it in `services/video/index.js`, then set `VIDEO_PROVIDER`. Videos are tracked by polling, so no webhook or public URL is needed.

## Production

- Build the frontend with `cd frontend && npm run build`, then serve `frontend/dist` (Vercel, Netlify, Nginx, cPanel). Add a SPA fallback so every route serves `index.html`.
- Run the API with `NODE_ENV=production npm start` (Render, VPS + PM2, cPanel Node app).
- Same domain (recommended): reverse-proxy `/api` to the Node app and keep `COOKIE_SAMESITE=lax`.
- Different domains: set `CLIENT_ORIGIN` to the frontend URL, `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true` and `VITE_API_URL`.

## Project structure

```
backend/src
  config/       env validation, db, seriesFields (form definition)
  models/       User, Project, Series, Video, Generation, Activity, Notification
  controllers/  auth, dashboard, series, videos, projects, generations, notifications, content
  services/     ai/claudeService, video/{index,kieProvider}, pdf/seriesPdf
  middleware/   auth (JWT cookie), error handler, ObjectId validation
  routes/       index.js (all REST endpoints under /api)
  content/      training.js, bonuses.js
frontend/src
  api/          axios client (withCredentials)
  context/      Auth, Toast
  components/   layout (Sidebar, Topbar, AppLayout, AuthLayout), common UI
  pages/        Login, Signup, Dashboard, FilmStudio, SeriesStudio/Create/Detail, MyProjects, ProjectDetail, MyVideos, GenHistory, Training, Bonuses
  styles/       theme.css
```

## API overview (all under `/api`)

`POST auth/signup|login|logout` · `GET auth/me` · `GET dashboard` ·
`GET|POST series` · `GET series/fields` · `GET|DELETE series/:id` · `POST series/:id/regenerate` · `GET series/:id/pdf` · `PATCH series/:id/episodes/:eid` · `POST series/:id/episodes/:eid/script` ·
`GET videos/options` · `POST videos/enhance-prompt` · `GET|POST videos` · `GET|DELETE videos/:id` · `GET videos/:id/download` ·
`GET|POST projects` · `GET|PATCH|DELETE projects/:id` · `GET generations` · `GET|DELETE generations/:id` ·
`GET notifications` · `POST notifications/read-all` · `GET training` · `GET bonuses`
