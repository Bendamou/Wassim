# Wassem — On-Demand Grooming Marketplace

## Overview
Full-stack MVP marketplace where clients post grooming jobs and verified professionals bid in real-time.

## Architecture
- **Frontend**: React + Vite (`artifacts/wassem`) at path `/`
- **Backend**: Express + Drizzle ORM (`artifacts/api-server`) at path `/api`
- **Database**: PostgreSQL via Replit built-in DB (env: `DATABASE_URL`)
- **API Contract**: OpenAPI spec in `lib/api-spec/openapi.yaml`; codegen via `pnpm --filter @workspace/api-spec run codegen`

## Tech Stack
- React 18, Vite, Wouter (routing), React Query, Zod, react-hook-form
- Express, Drizzle ORM, Pino logger
- Tailwind CSS v4, shadcn/ui components
- Dark neon theme: cyan `#00C1FF` + magenta `#FF00FF` on near-black `#0A0A0A`

## Key Files
| File | Purpose |
|------|---------|
| `artifacts/wassem/src/App.tsx` | Router, protected routes, auth gating |
| `artifacts/wassem/src/lib/auth.tsx` | Auth context, token storage (localStorage) |
| `artifacts/wassem/src/components/layout.tsx` | Sidebar (desktop) + bottom nav (mobile) + peacock mascot |
| `artifacts/wassem/src/index.css` | CSS variables — dark neon theme |
| `artifacts/api-server/src/routes/` | auth, professionals, jobs, bids, dashboard |
| `lib/api-spec/openapi.yaml` | Single source of truth for API contract |
| `lib/api-client-react/src/generated/api.ts` | Generated React Query hooks |
| `lib/api-zod/src/index.ts` | Must stay as `export * from "./generated/api"` only |
| `lib/db/src/schema.ts` | Drizzle schema: users, jobs, bids |

## Pages
### Client
- `/client/dashboard` — stats, top professionals, recent jobs
- `/client/post-job` — create a new grooming request
- `/client/jobs` — list all client's jobs
- `/client/jobs/:id/bids` — live bidding room (polls every 3s)

### Professional
- `/professional/dashboard` — stats, available jobs preview
- `/professional/jobs` — full job board (polls every 10s)
- `/professional/bid/:jobId` — send a bid on a job
- `/professional/profile` — profile, stats, bid history

## Auth
- SHA256+salt password hashing
- Token: base64-encoded `userId:timestamp` stored in localStorage
- Token getter registered via `setAuthTokenGetter` in AuthProvider
- Demo credentials (password: `demo123`):
  - `sofia@wassem.ma` — client
  - `karim@wassem.ma` — professional (verified)
  - `younes@wassem.ma` — professional (verified)

## Codegen Warning
After running `pnpm --filter @workspace/api-spec run codegen`, immediately overwrite `lib/api-zod/src/index.ts` to contain ONLY:
```ts
export * from "./generated/api";
```
Orval regenerates it with broken references otherwise.
