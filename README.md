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

- **Frontend:** _TODO_
- **Backend:** _TODO_
- **Database:** _TODO_

If free hosting is not available, the Docker setup in [§17](#17-docker-setup) is a fully reproducible one-command deployment on any machine with Docker.

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

![Last-seat race](docs/concurrency.png)

Two passengers may try to claim the final seat at the same instant. A naive read-check-write flow allows both to succeed and overbooks the vehicle. We prevent this with a **row-level lock** on the Tesla inside a single transaction.


**Guarantee:** `SUM(active seats on this Tesla) ≤ Tesla.capacity`, always.

**Proven by:** `tests/concurrency/seat-race.test.ts` fires two accepts with `Promise.allSettled` and asserts exactly one succeeds with `POOL_CAPACITY_EXCEEDED` on the other, then verifies the aggregate seat count never exceeds capacity.

