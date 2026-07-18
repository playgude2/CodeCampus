# CodeCampus

A scalable, LeetCode-style **coding-education platform backend** built with **NestJS + TypeScript + PostgreSQL**. Professors create coding problems and assignments; students submit code that is judged asynchronously against test cases in an isolated sandbox; staff grade the results.

CodeCampus is a from-scratch reimplementation of the Django app *ClassroomCoder*, re-architected for concurrency and horizontal scale (async job queue, worker pool, real-time verdicts) and hardened with best practices (typed config, explicit migrations, RBAC, per-testcase results).

## Features

- **Role-based access** — Admin / Professor / Student (a *grader* is a student granted grading rights in a classroom)
- **Problem management** — problems, test cases (sample/hidden), normalized tags, per-language code templates
- **Classrooms & assignments** — enrollment, assignment status state machine, per-assignment problem import/clone
- **Async code judge** — submissions are queued (BullMQ) and executed on **Piston**; live verdicts over WebSockets with REST polling fallback; per-test-case results
- **Grading** — auto-award points on first *Accepted*, gradebook roll-up, manual override
- **Playground** — public, stateless multi-language code runner

## Tech stack

| Concern | Choice |
|---|---|
| Framework | NestJS 10 (TypeScript, strict) |
| Database | PostgreSQL + TypeORM (explicit migrations) |
| Job queue / cache | BullMQ + Redis |
| Code sandbox | self-hosted [Piston](https://github.com/engineer-man/piston) |
| Realtime | Socket.IO (`/ws/submissions`) |
| Auth | JWT in httpOnly cookies (access + refresh), argon2 |
| Docs | OpenAPI / Swagger (`/api/docs`) |

## Architecture

```
Client ── REST /api/v1 ──▶ API (NestJS)
   ▲                          │  enqueue
   │ WebSocket / poll         ▼
   └──── Redis pub/sub ◀── Worker(s) ──▶ Piston pool (sandbox)
                              │
                          PostgreSQL
```

- The **API** is stateless (scale horizontally behind a load balancer).
- **Workers** consume the `judge` queue and run code on a Piston replica pool, bounded by a global in-flight semaphore.
- Judge progress is published to Redis and relayed to Socket.IO rooms, so clients get live `Pending → Running → Accepted` updates.

## Getting started

### Prerequisites
- Node.js ≥ 18, [pnpm](https://pnpm.io), Docker

### Setup
```bash
pnpm install
cp .env.sample .env            # fill in secrets for local dev
docker compose up -d redis piston piston-setup   # Redis + sandbox (installs runtimes)
# Ensure a Postgres database named `code` exists (or point DATABASE_* at your own)
pnpm migration:run             # apply schema
pnpm start:dev                 # API on http://localhost:3000
pnpm start:worker:dev          # judge worker (optional in dev — API also processes jobs)
```

Swagger UI: `http://localhost:3000/api/docs` · Health: `http://localhost:3000/api/v1/health`

### Full stack via Docker
```bash
docker compose up -d           # postgres, redis, piston, api, worker
```

## Project layout

```
src/
  config/         typed, Joi-validated configuration
  common/         base entity, guards, filters, decorators, pagination
  database/       TypeORM data source + migrations
  queue/          BullMQ setup     redis/   shared Redis client
  modules/
    auth/  users/  classrooms/  problems/  assignments/
    submissions/  code-execution/  grading/  playground/  demo/
```

## Scripts

| Command | Description |
|---|---|
| `pnpm start:dev` | Run the API in watch mode |
| `pnpm start:worker:dev` | Run a judge worker |
| `pnpm migration:generate src/database/migrations/<Name>` | Generate a migration from entity changes |
| `pnpm migration:run` | Apply pending migrations |
| `pnpm test` / `pnpm test:e2e` | Unit / e2e tests |
| `pnpm lint` / `pnpm typecheck` | Lint / type-check |

## License

See [LICENSE](LICENSE).
