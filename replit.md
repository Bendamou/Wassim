# Wassem — On-Demand Grooming Marketplace

## Overview
Full-stack MVP marketplace where clients post grooming jobs and verified professionals bid in real-time. Also features a **Walk-In Queue Engine** for barbershops.

## Architecture
- **Frontend**: React + Vite (`artifacts/wassem`) at path `/`
- **Backend**: Express + Drizzle ORM (`artifacts/api-server`) at path `/api`
- **Database**: PostgreSQL via Replit built-in DB (env: `DATABASE_URL`)
- **API Contract**: OpenAPI spec in `lib/api-spec/openapi.yaml`; codegen via `pnpm --filter @workspace/api-spec run codegen`

## Tech Stack
- React 18, Vite, Wouter (routing), React Query, Zod, react-hook-form
- Express, Drizzle ORM, Pino logger
- Tailwind CSS v4, shadcn/ui components
- **Cyber Purple theme**: Neon Cyan `#00f2ff` + Neon Pink `#ff007f` on deep purple `#0f051d` (cards `#1c0c3a`, text `#f3f1f6`)

## Key Files
| File | Purpose |
|------|---------|
| `artifacts/wassem/src/App.tsx` | Router, protected routes, auth gating |
| `artifacts/wassem/src/lib/auth.tsx` | Auth context, token storage (localStorage) |
| `artifacts/wassem/src/components/layout.tsx` | Sidebar (desktop) + bottom nav (mobile) + peacock mascot |
| `artifacts/wassem/src/index.css` | CSS variables — dark neon theme |
| `artifacts/api-server/src/routes/` | auth, professionals, jobs, bids, dashboard, salons |
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

### Salon Owner
- `/salon/dashboard` — Go Live toggle, Lost Revenue Estimator, chair management, live queue
- `/salon/:id` — public salon profile with Walk-In Now CTA + mock payment modal
- `/salon/analytics` — analytics page

## Walk-In Queue Engine
- **Go Live toggle**: Salon owners tap once to appear on the client map (5km geofenced)
- **Lost Revenue Estimator**: Live ticker on the dashboard showing MAD lost to idle chairs
- **No-Show Lock**: Clients pay a 20 MAD mock deposit to claim a chair (mock card form)
- **Queue management**: Barber sees active claims with Check In / No-Show actions
- **Map**: Live shops get a cyan "● LIVE · N" badge on map markers

### New DB Tables / Columns
- `salons.is_live` (boolean) — whether the shop is broadcasting live
- `salons.live_since` (timestamptz) — when they went live (for revenue calc)
- `salons.avg_service_price` (int, default 80 MAD) — used in revenue estimator
- `chair_claims` — id, salon_id, chair_id, client_id, status, deposit_amount, card_last4, card_holder, created_at, expires_at

### API Endpoints
- `POST /api/salons/:id/go-live` — toggle is_live (owner only)
- `GET /api/salons/nearby?lat=&lng=&radius=5` — live shops with open chairs within radius km
- `POST /api/salons/:id/claim-chair` — client claims a walk-in slot (mock payment)
- `GET /api/salons/:id/queue` — active claims for barber queue view
- `PATCH /api/claims/:id` — update claim status (completed/noshow/cancelled)
- `GET /api/claims/mine` — client's active claims

## Auth
Login uses **phone number**. SHA256+salt password hashing also available for API access.
Token: base64-encoded `userId:timestamp` stored in localStorage.

### Demo credentials — use phone number to log in:
| Phone | Name | Role |
|-------|------|------|
| `0612345678` | Test Client | client |
| `0661100001` | Yassine | client |
| `0661100002` | Malak | client |
| `0661200001` | Hamza the Barber | salon_owner → Barber House Maarif |
| `0661200002` | Salon Elite | salon_owner → Salon Elite Casa |
| `0661200005` | Tariq Style | salon_owner → Tariq Style Centre |
| `0661200010` | Karim Pro Oujda | salon_owner → Karim Pro Oujda |

### Email/password (API-only, not in the phone-login UI):
- `sofia@wassem.ma` / `demo123` — client
- `karim@wassem.ma` / `demo123` — professional (verified)
- `younes@wassem.ma` / `demo123` — professional (verified)
- `hamza@wassem.app` / `demo123` — salon_owner (Barber House Maarif)

## Codegen Warning
After running `pnpm --filter @workspace/api-spec run codegen`, immediately overwrite `lib/api-zod/src/index.ts` to contain ONLY:
```ts
export * from "./generated/api";
```
Orval regenerates it with broken references otherwise.
