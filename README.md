# IB Community

Private trading community platform. Access to premium modules requires broker (IB) MT5 verification.

## Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind, shadcn/ui → Vercel
- **Backend:** Go Fiber, GORM, PostgreSQL, JWT → Ubuntu VPS + Nginx
- **Storage:** Local VPS (MVP), abstractable to Cloudflare R2 / Stream

## Monorepo

```text
frontend/   Next.js app
backend/    Go Fiber API
storage/    Local uploads (gitignored contents)
docs/       Architecture & API docs
backups/    Ops backups
```

## Quick start (dev)

### 1. Database

Requires Docker Desktop (or any Postgres 16 matching `.env`).

```bash
docker compose up -d
```

If Docker is unavailable, point `backend/.env` at your local Laragon/Postgres instance and create database `ib_community`.

### 2. Backend

```bash
cd backend
cp ../.env.example .env
# adjust if needed
go run ./cmd/api
```

API: `http://localhost:8080` · Health: `GET /health`

### 3. Frontend

```bash
cd frontend
cp ../.env.example .env.local   # keep NEXT_PUBLIC_* vars
npm install
npm run dev
```

App: `http://localhost:3000`

## Docs

- [Architecture](docs/architecture.md)
- [Database](docs/database.md)
- [API](docs/api.md)
- [Flows](docs/flows.md)
- [UI](docs/ui.md)
- [Deployment](docs/deployment.md)

## Defaults (MVP)

- UI accent: **blue `#0052FF`**, light-first premium SaaS surfaces
- Member: top navigation + content carousels; Admin: Linear-style sidebar
- Typography: **Outfit** (display) + **Plus Jakarta Sans** (body)
- AI CS: **rule / knowledge base** with page redirects; escalate to human after 3 failures

## Seed users (dev)

Password for all: `password123`

| Email | Role | Status |
|-------|------|--------|
| `member@ib.local` | member | onboarding |
| `verified@ib.local` | member | verified |
| `admin@ib.local` | admin | verified |
| `super@ib.local` | super_admin | verified |

Seeded automatically on API startup if missing.

## P1 quick test

1. Login `member@ib.local` → `/onboarding` (5 steps, no skip)
2. Complete steps → status `pending_verification`
3. Login `admin@ib.local` → `/admin/verifications` → Approve
4. Login member again → status `verified`, modul unlock

## P2 quick test

1. Guest/member unverified → `/member/academy` shows **Locked** cards
2. `verified@ib.local` → open content, body visible, bookmark works
3. `admin@ib.local` → `/admin/content` create/publish

## P3 quick test

1. Unverified → `/member/signals|journal|bonus` show locked shell
2. `verified@ib.local` → signals list, create journal entry, open bonus + Telegram link
3. `admin@ib.local` → `/admin/signals` publish/close · `/admin/bonuses` CRUD

## P4 quick test

1. Floating chat FAB → opens **right drawer** → ask `deposit` / `telegram` → reply + Open page
2. Ask nonsense 3× → `Need human assistance?` → Support ticket prefills topic
3. `verified@ib.local` → `/member/support` create ticket · admin `/admin/tickets` reply
4. Member bell shows notification after admin reply

## UI notes

- Member: **top navigation** (no permanent sidebar), Netflix-style content carousels, AI right drawer
- Admin: separate Linear-style left nav for ops
- Accent blue `#0052FF`, light premium SaaS surfaces

## P5 deploy (summary)

1. Vercel: set `NEXT_PUBLIC_API_URL=https://api.example.com/v1`
2. VPS: production `.env` (`APP_ENV=production`, strong `JWT_SECRET`, `FRONTEND_URL`, `DB_SSLMODE=require`)
3. Install `deploy/ib-api.service` + `nginx/sites/ib-community.conf`
4. Ship binary: `DEPLOY_HOST=user@host ./scripts/deploy.sh`

See [docs/deployment.md](docs/deployment.md) for the full checklist.

