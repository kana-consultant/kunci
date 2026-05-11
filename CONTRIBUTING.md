# Contributing to KUNCI

## Setup

```bash
# Start PostgreSQL 17 + Redis 7
docker compose -f docker-compose.dev.yml up -d

# Install dependencies
pnpm install

# Copy and configure env
cp .env.example .env
# Edit .env with your API keys

# Start dev servers (API :3001, Web :3000)
pnpm dev
```

## Commands

```bash
pnpm lint          # Biome check (lint + format)
pnpm lint:fix      # Auto-fix lint/format issues
pnpm typecheck     # tsc --noEmit across all packages
pnpm test          # Vitest across all packages
pnpm test --coverage  # With coverage report
```

## Branch Naming

```
feat/<slug>       # new feature
fix/<slug>        # bug fix
test/<slug>       # test coverage
chore/<slug>      # tooling, deps, config
agent/<task-id>-<slug>   # AI agent PRD tasks
```

## Commit Convention

Conventional Commits with scope = feature area. Subject ≤ 50 chars.

```
feat(ai): add reasoning model temperature guard
fix(webhook): enforce RESEND_WEBHOOK_SECRET in prod
test(application): add capture-lead use-case tests
chore(env): document SLACK_WEBHOOK_URL in .env.example
```

Body wraps at 72 chars. Explain the *why*, not the *what*. Reference PRD task at end:
```
Refs: PRD TASK-004
```

No `Co-Authored-By: Claude` / AI trailers.

## Architecture Rules

Four-layer clean architecture — dependencies flow inward only:

```
Presentation (oRPC routers, webhooks)
  └── Application (use cases, orchestration)
        └── Domain (entities, port interfaces)
              └── Infrastructure (DB, Redis, AI, Email, Scraper)
```

- No infra imports inside `domain/` or `application/`
- All AI calls via `infrastructure/ai/client.ts callOpenRouter`
- All UI via `@kana-consultant/ui-kit` primitives
- Tests colocated `*.test.ts` next to the file under test
- Path alias: `#/` → `apps/api/src/`, `~/` → `apps/web/src/`
- Never edit `routeTree.gen.ts` directly

## AI Agent Workflow

See `documentation/prd/TECHNICAL_PRD_AGENT_WORKLOAD.md §0` for the full agent loop spec. Tasks are tracked in `documentation/prd/PROGRESS.md`.

Relevant skills: `kana-monorepo-fullstack-typescript`, `kana-ui-kit`, `clean-code`

## Hard Constraints (require human approval)

- Schema migrations that drop/change columns
- New 3rd-party dependencies beyond OpenRouter / Resend / Deepcrawl
- Major version bumps of `react`, `hono`, `drizzle-orm`, `better-auth`, `@kana-consultant/ui-kit`
- Changing auth, email, or LLM provider
