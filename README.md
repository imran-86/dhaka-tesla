# Dhaka Tesla Pool — Ride-Pooling MVP

> Share a Tesla. Split the fare.

A ride-pooling MVP set in Dhaka. Passengers request rides between named zones, a driver accepts one or more requests into a shared pool, fares are recalculated for the whole pool, and every passenger sees only their own trip, fare, and payment status.

Built for the **RoBenDevs Internship Challenge**. Uses the story cast from the brief — **Jashim** (driver, "Bullet" Tesla), **Nusrat**, **Rafiq**, **Shirin** (passengers) — throughout the seed data, tests, and demo.

---

## Table of contents

1. [Summary](#1-summary)
2. [The problem](#2-the-problem)
3. [Demo video](#3-demo-video)
4. [Live deployment](#4-live-deployment)
5. [Demo credentials](#5-demo-credentials)
6. [Features implemented](#6-features-implemented)
7. [Screenshots](#7-screenshots)
8. [Architecture](#8-architecture)
9. [Database (ERD)](#9-database-erd)
10. [Lifecycles & concurrency](#10-lifecycles--concurrency)
11. [Tech stack](#11-tech-stack)
12. [Tech decisions & trade-offs](#12-tech-decisions--trade-offs)
13. [Project structure](#13-project-structure)
14. [Prerequisites](#14-prerequisites)
15. [Environment variables](#15-environment-variables)
16. [Local setup (no Docker)](#16-local-setup-no-docker)
17. [Docker setup](#17-docker-setup)
18. [Migrations & seed](#18-migrations--seed)
19. [Running tests](#19-running-tests)
20. [API overview](#20-api-overview)
21. [Git workflow](#21-git-workflow)
22. [Known limitations](#22-known-limitations)
23. [Next improvements](#23-next-improvements)
24. [Viral-scale reasoning (optional)](#24-viral-scale-reasoning-optional)
25. [AI usage](#25-ai-usage)
26. [Credits](#26-credits)

---

## 1. Summary

<!-- TODO: Write 2–3 sentences. Suggested draft below, keep or refine. -->

**Dhaka Tesla Pool** is a ride-pooling MVP where multiple passengers can share a single battery-powered three-seater ("Tesla" in the brief) called **Bullet**, driven by **Jashim**. Passengers request a ride between named Dhaka zones, a driver accepts requests into a **pool**, fares are recalculated per passenger once a pool forms, and every actor sees only what they are allowed to see. The focus is on clean domain modelling, correct state transitions, and provable concurrency safety around the last-seat race — not on real map routing.

## 2. The problem

<!-- TODO: 1 paragraph, English. Draft: -->

Every morning in Dhaka, people heading in nearly the same direction take separate rides because there is no easy way to share. The brief describes Nusrat (Banani → Mohakhali) and Rafiq (Banani → Gulshan 1) booking nearly identical routes within seconds of each other, and Jashim — with three seats on his Bullet — having no way to combine their trips, split the fare fairly, or track who is riding when.

The MVP solves this by:

- Modelling **zones** and a **corridor matching rule** so overlapping trips can be paired deterministically (no map APIs, no routing engine).
- Introducing a **Pool** that binds multiple RideRequests to one Tesla.
- Ensuring **occupied seats never exceed capacity**, even under concurrent accepts.
- Calculating an **individual fare** for every passenger, with a 20% discount that only applies when at least two distinct passengers actually share the Tesla.
- Keeping **payment** and **status history** so a completed trip can always be explained.

## 3. Demo video

<!-- TODO: Record a ≤6-minute video (Loom or similar free tool) following Section 13 of the brief.
     Structure:
       0:00–1:00 — your understanding of the problem, users, core idea (don't recite the PRD)
       1:00–3:00 — engineering: architecture, backend, frontend, DB, lifecycle, one key decision, one trade-off
       3:00–6:00 — product tour: passenger flow, driver flow, pooling, fare/status, edge case, deployment
     Paste the link below. -->

📹 **Demo video:** _TODO — paste link here_

## 4. Live deployment

<!-- TODO: If you deploy to a free tier (Vercel + Railway/Render/Fly), paste URLs here.
     If free hosting is not available for the backend, state that and point to the Docker setup as a reproducible alternative. -->

- **Frontend:** https://dhaka-tesla-nine.vercel.app/
- **Backend:** https://dhaka-tesla-api-feol.onrender.com/
- **Database:** Neon Postgres (AWS ap-southeast-1, Singapore)

Both services run on free tiers. The Render backend spins down after
15 minutes of inactivity — the first request after idle takes
30–60 seconds to wake it. The Vercel frontend has no such delay.
During the demo video, the backend is warmed up beforehand.

## 5. Demo credentials

All demo accounts share the password **`Tesla@123`**.

| Role | Name | Email | Notes |
|---|---|---|---|
| Driver | Jashim | `jashim@dhaka-tesla.local` | Owns Tesla "Bullet" (capacity 3) |
| Passenger | Nusrat | `nusrat@dhaka-tesla.local` | Banani → Mohakhali |
| Passenger | Rafiq | `rafiq@dhaka-tesla.local` | Banani → Gulshan 1 |
| Passenger | Shirin | `shirin@dhaka-tesla.local` | Banani → Farmgate |

## 6. Features implemented

**Passenger**
- Sign up / sign in with role-aware redirect
- Live Tesla availability card (seats free, driver name)
- Ride request form with **live fare preview** (solo + pooled side-by-side)
- Active ride card with state-driven UI (`REQUESTED` → `MATCHED` → `COMPLETED`)
- Cancel while the ride is still cancellable
- Payment page with two methods (Cash / simulated TeslaPay)
- "Payment due" blocking — cannot request a new ride until the last trip is paid
- Full ride history with payment status badges

**Driver**
- Online / offline toggle
- Pending requests list (only when online)
- Accept one or more requests into a pool (with live seat-usage preview)
- Pool lifecycle: start trip → complete trip, or cancel before start
- Stats header (completed trips, total revenue, passengers served)
- Driver history page

**Backend / platform**
- JWT auth (httpOnly cookie, 7-day expiry, no refresh tokens)
- Role-based access control (`PASSENGER` / `DRIVER`)
- Ownership enforced at query level, not after fetch (404 not 403)
- Fare engine with integer paisa, hand-testable
- Concurrency-safe pool acceptance via PostgreSQL row lock (`SELECT ... FOR UPDATE`)
- Consistent JSON error shape: `{ error: { code, message } }`
- Zod validation on every write endpoint
- Migrations, seed, Docker Compose, health checks
- 19 automated tests covering concurrency, auth isolation, state transitions, and fare logic

## 7. Screenshots

<!-- TODO: Add screenshots. Recommended list:
     - Landing page (login)
     - Signup with driver toggle
     - Passenger dashboard — Tesla card + ride request form with fare preview
     - Active ride — MATCHED state showing pooled fare
     - Payment page (Cash / TeslaPay)
     - Payment success banner
     - Driver dashboard — online with pending list
     - Driver dashboard — active pool card
     - Driver history — stats row
     - Passenger history with "Paid" / "Payment due" badges
-->

## 8. Architecture

![System architecture](docs/architecture.png.png)

## 9. Database (ERD)

![ERD](docs/erd.png)

**Reading the diagram:** five tables, one relation chain from `User` through `Tesla` and `Pool` to `RideRequest` and `Payment`.

**Table-by-table:**

| Table | Purpose | Key constraint |
|---|---|---|
| `users` | Passengers and drivers | `email` unique; `role` decides what the user can do |
| `teslas` | One Tesla per driver | `driverId` unique — a driver cannot own two Teslas |
| `pools` | A shared ride bound to one Tesla | Indexed on `teslaId` and `status` for fast active-pool lookups |
| `ride_requests` | A passenger's request | `poolId` is **nullable** — a request exists before it is matched |
| `payments` | Settlement per passenger per pool | Unique `(poolId, passengerId)` — one payment per passenger per trip |

**Money is always an integer.** Every monetary field (`farePoysha`, `amountPaisa`) is stored in the smallest unit — paisa / poysha (1/100 BDT). Floating-point money is a class of bug we chose to remove entirely.


## 10. Lifecycles & concurrency
### Pool lifecycle

![Pool lifecycle](docs/lifecycles.png)
The pool lifecycle is **separate** from the ride lifecycle. `DRIVER_ARRIVED` and `STARTED` are pool-level events — a passenger does not "start" alone when sharing a Tesla.

### The last-seat race

![Last-seat race](docs/concurrency.png.png)

Two passengers may try to claim the final seat at the same instant. A naive read-check-write flow allows both to succeed and overbooks the vehicle. We prevent this with a **row-level lock** on the Tesla inside a single transaction.


**Guarantee:** `SUM(active seats on this Tesla) ≤ Tesla.capacity`, always.

**Proven by:** `tests/concurrency/seat-race.test.ts` fires two accepts with `Promise.allSettled` and asserts exactly one succeeds with `POOL_CAPACITY_EXCEEDED` on the other, then verifies the aggregate seat count never exceeds capacity.

## 11. Tech stack

| Layer | Choice | Version |
|---|---|---|
| Frontend | Next.js (App Router), React, TypeScript | 15.x / 19.x / 5.x |
| Styling | Tailwind CSS | 3.x |
| Backend | Express, TypeScript, ESM | 5.x |
| Runtime | Node.js | 22 LTS |
| ORM | Prisma + `@prisma/adapter-pg` | 7.x |
| Database | PostgreSQL | 16 (Alpine) |
| Auth | JWT (`jsonwebtoken`) + bcryptjs | — |
| Validation | Zod | 3.x |
| Tests | Vitest + Supertest | 5.x |
| Build (backend) | tsup | 8.x |
| Container | Docker + Docker Compose | — |

## 12. Tech decisions & trade-offs

Every non-mandated choice below lists: what I picked, what else I considered, why it fits a ride-pooling MVP, how I would defend it in a review, and what would make me switch.

### Database — PostgreSQL 16

- **What I picked:** PostgreSQL 16 running in Docker.
- **Alternatives:** MySQL, SQLite.
- **Why for this project:** The single hardest correctness problem in the brief is the last-seat race — two passengers claiming the final seat at the same instant. PostgreSQL's `SELECT ... FOR UPDATE` gives me a real row-level lock I can reason about, and its default `READ COMMITTED` isolation combined with that lock is exactly what I need. 

- **What would make me switch:** If the workload became read-dominated with no write contention and I needed edge replication, I'd look at a distributed store with a different consistency model.

### ORM — Prisma 7

- **What I picked:** Prisma 7 with `@prisma/adapter-pg`.
- **Alternatives:** Drizzle, TypeORM, raw `pg`.
- **Why for this project:** Two things specifically. First, I need raw SQL for the `SELECT ... FOR UPDATE` on the Tesla row, and Prisma lets me mix `$queryRaw` inside a `$transaction` with normal typed queries — so I get the lock without giving up the ORM. Second, migrations and typed relations (User → Tesla → Pool → RideRequest → Payment) are what I want for a domain with six tables and four relations.

- **What would make me switch:** If I needed very tight control over generated SQL, or a much smaller runtime — then Drizzle or raw SQL would earn its keep.

### Auth — JWT in httpOnly cookie, no refresh tokens

- **What I picked:** Short-lived JWT (7 days) stored in an httpOnly cookie, no refresh token.
- **Alternatives:** Server-side session store (Redis / DB), Passport.js, NextAuth.
- **Why for this project:** httpOnly means JavaScript cannot read the token, so an XSS cannot steal it. The cookie is set by the Next.js server when it calls the backend, so the browser never handles the raw token either. For an MVP with one Tesla and three demo users, refresh-token rotation adds a whole second endpoint, token storage, and revocation logic that has no payoff here.

- **What would make me switch:** If I needed strong session revocation or multi-device session management, I'd move to server-side sessions or short-lived access tokens with refresh.

### Backend framework — Express 5

- **What I picked:** Express 5 on Node 22 with TypeScript and ESM.
- **Alternatives:** Fastify, NestJS, Hono.
- **Why for this project:** Express 5's middleware chain (`auth → validate → handler → errorHandler`) maps one-to-one onto the concerns I have: authentication, input validation, business logic, and a single place where errors are shaped into the JSON response the frontend expects. The order is explicit and readable, which matters because a new reviewer should be able to trace a request through the code in under a minute.

- **What would make me switch:** If the team grew past a handful of engineers and needed an opinionated module structure out of the box — NestJS would then earn its learning curve.

### Frontend — Next.js 15 App Router with Server Components + Server Actions

- **What I picked:** Next.js 15 App Router, Server Components for reads, Server Actions for writes.
- **Alternatives** Plain React + Vite, Remix.
- **Why for this project:** Three concrete reasons. First, cookie auth: the Next.js server reads the cookie and forwards it to the API, so I have zero CORS setup and no client-side token storage. Second, role-based redirects happen **on the server** before any HTML is sent — a passenger never even sees a flash of the driver dashboard. Third, Server Actions removed the entire client-side fetch layer; forms post straight to a server function.

- **What would make me switch:** If I needed a fully client-rendered, offline-first experience, Next.js's server-centric model would fight me.

### Validation — Zod

- **What I picked:** Zod schemas for every request body, params, and query on the backend.
- **Alternatives:** Joi, Yup, class-validator.
- **Why for this project:** One schema gives me both the runtime check and the TypeScript type via `z.infer`. That means the backend and the frontend can share the same source of truth for input shape, and my `validate(schema)` middleware has one job: reject anything that doesn't match, then hand the typed result to the controller.

- **What would make me switch:** If the project grew to need an OpenAPI-first workflow, I'd switch to Zod-to-OpenAPI or a spec-first tool.

### Tests — Vitest + Supertest

- **What I picked:** Vitest with Supertest against an in-memory Express app.
- **Alternatives:** Jest, Node's native test runner.
- **Why for this project:** My backend is `"type": "module"` (ESM). Vitest is ESM-native — Jest still needs config tweaks for ESM, and I'd rather not fight that. Supertest against `createApp()` means I can run tests without opening a real port, which makes them fast and reliable in CI.

- **What would make me switch:** If I needed browser-level end-to-end coverage, I'd add Playwright on top — not replace Vitest.

### Money — integer paisa / poysha

- **What I picked:** Every monetary value stored as an `Int` in the smallest unit (`poysha`, 1/100 BDT).
- **Alternatives:** Floating-point decimals, `Decimal` type in the database.
- **Why for this project:** Floating-point money is a classic bug class — `0.1 + 0.2 !== 0.3`. When I compute a 20% pool discount and then split it across seats, I want exact arithmetic. Integer poysha gives me that, and every fare in the test suite is a number I can verify by hand: 7500 poysha solo, 6000 pooled, no rounding surprises.
- **What would make me switch:** If I ever needed sub-poysha precision for currency conversion at scale, I'd move to a decimal library — but that's a hypothetical, not a current need.

### Fare discount rule — passengers, not seats

- **What I picked:** The 20% pool discount applies only when **at least two distinct passengers** share a Tesla. A single passenger booking two seats does not unlock the discount on their own.
- **Alternatives:** Applying the discount per-seat, so two seats booked by one passenger would trigger it.
- **Why for this project:** The brief's intent is clear — the discount exists to incentivise **sharing with a stranger**. If one person could book two seats and get the discount alone, the rule would be trivially exploitable and would stop rewarding the behaviour it was designed for.
- **What would make me switch:** If user research showed families consistently travelled together and needed a group discount, I'd add an explicit group-fare rule instead of loosening the sharing rule.

## 13. Project structure

```
dhaka-tesla/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── app.ts                # createApp() factory + default instance
│   │   ├── server.ts             # boot + graceful shutdown
│   │   ├── config/env.ts         # Zod-validated environment variables
│   │   ├── lib/prisma.ts         # shared PrismaClient with pg adapter
│   │   ├── middlewares/          # auth, validate, error
│   │   ├── modules/              # auth, rides, driver, tesla, payments
│   │   ├── routes/index.ts       # top-level router
│   │   └── utils/                # AppError, constants, jwt, catchAsync
│   ├── tests/
│   │   ├── auth/isolation.test.ts
│   │   ├── rides/state-transitions.test.ts
│   │   ├── concurrency/seat-race.test.ts
│   │   └── fare/pool-fare.test.ts
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── docker-entrypoint.sh
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                  # App Router pages, layouts, actions
│   │   ├── components/           # ui, layout, auth, passenger, driver
│   │   ├── lib/api/              # server-side fetch helpers
│   │   ├── types/
│   │   └── hooks/
│   ├── next.config.ts
│   └── package.json
├── docs/
│   ├── architecture.png
│   ├── erd.png
│   ├── ride-lifecycle.png
│   ├── pool-lifecycle.png
│   └── concurrency.png
├── docker-compose.yml
├── .gitattributes
└── README.md
```

## 14. Prerequisites

- **Node.js 22+** — `node -v`
- **Docker Desktop** (Windows / macOS) or `docker` + `docker compose` (Linux)
- **Git**

## 15. Environment variables

Copy `.env.example` to `.env` in both `backend/` and `frontend/`.

### `backend/.env`

```env
NODE_ENV=development
PORT=4000

# Points at the Postgres container published on localhost:5432.
# Container-to-container traffic uses the hostname `db` instead.
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dhaka_tesla_pool?schema=public"

JWT_SECRET=replace-with-a-long-random-string-at-least-32-characters
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
```

### `frontend/.env.local`

```env
# Used by the browser (rarely needed — the Next.js server proxies most calls)
NEXT_PUBLIC_API_URL=http://localhost:4000

# Used by Server Components and Server Actions (never exposed to the browser)
API_URL_INTERNAL=http://localhost:4000
```



## 16. Local setup (no Docker)

Requires a running PostgreSQL on `localhost:5432` with a database named `dhaka_tesla_pool`.

```bash
# Backend
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev            # http://localhost:4000

# Frontend (in a second terminal)
cd frontend
npm install
npm run dev            # http://localhost:3000
```

## 17. Docker setup

One command from the repo root:

```bash
docker compose up --build
```

This starts:

- **db** — PostgreSQL 16, data persisted in the `dhaka_tesla_db_data` volume
- **api** — Node.js 22 backend, migrations applied automatically via `docker-entrypoint.sh`

Health checks: `db` uses `pg_isready`; `api` checks `GET /health`.

### Seed the database (once, after the first boot)

```bash
docker compose exec api npm run db:seed
```

### Stop

```bash
docker compose down            # keep data
docker compose down -v         # also delete the volume
```

## 18. Migrations & seed

### Local

```bash
cd backend
npm run db:migrate -- --name <descriptive_name>
npm run db:seed
```

### Inside Docker

```bash
docker compose exec api npx prisma7 migrate deploy   # already runs on boot
docker compose exec api npm run db:seed
```

The seed wipes the domain tables (`payments`, `ride_requests`, `pools`, `teslas`, `users`) and re-creates the story cast: Jashim + Bullet, plus Nusrat, Rafiq, and Shirin.

## 19. Running tests

```bash
cd backend
npm run test
```

**Coverage (19 tests across 4 files):**

| File | What it proves |
|---|---|
| `tests/concurrency/seat-race.test.ts` | Two concurrent accepts cannot overbook; the capacity invariant holds under load |
| `tests/auth/isolation.test.ts` | Passengers cannot read or cancel each other's rides; role boundaries; unauthenticated access is rejected |
| `tests/rides/state-transitions.test.ts` | Every illegal ride/pool state transition returns `422 INVALID_STATE_TRANSITION` |
| `tests/fare/pool-fare.test.ts` | Solo and pooled fares for Nusrat and Rafiq match the hand-calculated values |

## 20. API overview

Base URL: `http://localhost:4000`

All success responses: `{ "data": ... }`
All errors: `{ "error": { "code": "...", "message": "..." } }`

### Auth — `/api/auth`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/signup/passenger` | public | Create a passenger, set auth cookie |
| POST | `/signup/driver` | public | Create a driver + Tesla in one transaction |
| POST | `/login` | public | Verify credentials, set auth cookie |
| POST | `/logout` | public | Clear the cookie |
| GET | `/me` | authenticated | Current user (never returns `passwordHash`) |

### Rides — `/api/rides`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/` | passenger | Create a ride request (fare computed at request time) |
| POST | `/estimate` | passenger | Stateless fare preview (solo + pooled) |
| GET | `/me` | passenger | List own rides |
| GET | `/:id` | owner passenger or assigned driver | Single ride |
| POST | `/:id/cancel` | owner passenger | Cancel while status is `REQUESTED` or `MATCHED` |

### Driver — `/api/driver`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/status` | driver | Current Tesla status |
| PATCH | `/status` | driver | Go online / offline |
| GET | `/stats` | driver | Completed trips, total revenue, passengers served |
| GET | `/requests` | driver (online) | Pending `REQUESTED` rides |
| GET | `/pools` | driver | Own pools (history + active) |
| POST | `/pools/accept` | driver | Accept one or more rides into a pool |
| POST | `/pools/:id/start` | driver | Start the trip |
| POST | `/pools/:id/complete` | driver | Complete the trip |
| POST | `/pools/:id/cancel` | driver | Cancel before start |

### Tesla — `/api/tesla`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/status` | authenticated | Public availability card (capacity, occupied, driver) |

### Payments — `/api/payments`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/` | passenger | Create a payment for a completed pool |
| GET | `/me` | passenger | Own payment history |
| GET | `/pending` | passenger | Completed rides still awaiting payment |

### Health

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/health` | public | Liveness probe |

## 21. Git workflow

Long-lived branches:

- `master` — integrated MVP
- `pre-release` — integration fixes, docs, deployment checks
- `release/v1.0.0` — the version shown in the demo

Feature work uses short-lived branches, merged into `master` with `--no-ff` when they work:

- `feature/authentication`
- `feature/ride-request`
- `feature/driver-flow`
- `feature/docker`
- `feature/frontend-setup`
- `feature/passenger-dashboard`
- `feature/driver-passenger-history`

Commit messages follow `<type>(<scope>): <short description>` with types `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`.

## 22. Known limitations

- **Single-Tesla assumption.** The MVP is deliberately built around one Tesla (Bullet, capacity 3). `GET /api/driver/requests` returns all pending rides without driver-specific filtering, which is correct for one driver but would need a corridor/zone filter under multi-Tesla operation.
- **No refresh tokens.** Access tokens expire in 7 days; there is no silent renewal. A user with a stale cookie is redirected to log in again.
- **No real payment gateway.** Cash and TeslaPay are simulated; no Stripe or bKash integration. A `Payment` row is written when the passenger confirms the method.
- **No map routing.** Zones are a fixed enum with a hand-set distance matrix; the corridor matching rule is directional and rule-based.
- **No rate limiting.** Explicitly deferred; simple to add via `express-rate-limit` on `/api/auth/*`.

- **Multi-seat bookings do not unlock the pool discount.** A single passenger booking two seats on the same route is treated as one passenger. This is deliberate — the discount exists to reward sharing with a stranger.

## 23. Next improvements

- Refresh tokens with rotation and a `/auth/refresh` endpoint
- Multi-Tesla support: driver-specific request filtering by corridor proximity
- DB-level `CHECK` constraint enforcing `occupied + 1 <= capacity` as a last line of defence
- OpenAPI spec generated from the existing Zod schemas
- Structured JSON logging via `pino` (dependency already installed)

## 24. Viral-scale reasoning (optional)

> "If Oi Tesla goes viral" — scaling to 1M passengers and 100k drivers.

- **Load balancing & horizontal scaling.** Stateless API behind a load balancer; sticky sessions are not required because auth lives in the JWT cookie.
- **DB indexing & read replicas.** Index on `(tesla_id, status)` for active pools and `(passenger_id, created_at)` for history. Route read-heavy queries (history, stats) to replicas.
- **Caching.** Tesla availability and driver stats are read-heavy; a few-second cache with explicit invalidation on write cuts DB load.
- **Geospatial search.** Replace the fixed zone enum with a PostGIS `geography` column and spatial index for real pickup-radius matching.
- **Queues / events.** Emit `ride.requested`, `pool.matched`, `ride.completed` to a queue (SQS / Redis Streams) for notification fan-out and audit.
- **Real-time.** SSE per user connection for ride/pool status; a small pub/sub layer keyed by `user_id`.
- **Rate limiting & idempotency.** Rate-limit auth and ride-creation endpoints. Accept an `Idempotency-Key` on `POST /api/rides` and `POST /api/payments` so retries are safe.
- **DB contention.** The per-Tesla row lock becomes a hotspot. Migrate to per-Tesla reservation rows with a unique `(tesla_id, seat_no)` constraint, or an application-side per-Tesla queue.
- **Observability.** Structured logs, RED metrics, distributed tracing across API + DB + queue. Alert on capacity-check failure rate.
- **Security.** Rotate secrets, add CSRF for cookie flows, audit admin actions, keep PII minimal, TLS everywhere.
- **Deployment.** Blue/green deploys of the API; migrations run as a separate one-shot job before the new version takes traffic.

## 25. AI usage

Per Section 8 of the brief, this section is required and honest.

**Tools used:**

- **Claude (Anthropic)** — architecture discussions, code review, PRD interpretation, refactors
- **ChatGPT** — drafting helper functions, quick syntax checks
- **Deepseek** — get the real code with proper DeepThink

**What for:**

- Scaffolding the initial Express + Prisma project
- Drafting Zod schemas for request validation
- Generating the Mermaid diagrams in this README and in `docs/`
- Reviewing the concurrency design and confirming `FOR UPDATE` as the right primitive
- Writing test skeletons for the fare and auth-isolation suites

**One accepted suggestion:**

- **Suggestion:** Wrap the Tesla row read in a `SELECT ... FOR UPDATE` inside the acceptance transaction.
- **Why accepted:** It solves the last-seat race cleanly without introducing a queue or a distributed lock, and PostgreSQL's row-level locking is a native, well-documented feature.
- **Where in code:** `backend/src/modules/driver/driver.service.ts`, `acceptRideRequests()`.

**One rejected / changed suggestion:**

- **Suggestion:** Integrate Stripe for the payment flow, with webhooks and idempotency keys.
- **Why rejected:** The brief explicitly says "no real gateway needed — Cash or simulated TeslaPay." Stripe would add secrets, webhook infrastructure, and dead code for zero MVP value.
- **What was done instead:** Simulated Cash / TeslaPay — a single `Payment` row written when the passenger confirms the method.



## 26. Credits

- **Brief and story cast:** RoBenDevs Internship Challenge
- **Built by:** Imran Ahmed — [GitHub @imran-86](https://github.com/imran-86)
- **License:** Assessment submission — not licensed for redistribution.

---

Built for the RoBenDevs assessment. In Dhaka, your Tesla may have three wheels — but your engineering should still be production-minded.
