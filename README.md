<p align="center">
  <img src="https://img.shields.io/badge/KUNCI-AI%20SDR-6C3FE8?style=for-the-badge&labelColor=1a1a2e" alt="KUNCI" />
  <br />
  <strong>AI-Powered Sales Development Representative</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#usage">Usage</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.4+-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Hono-4.7-E36002?style=flat-square&logo=hono&logoColor=white" alt="Hono" />
  <img src="https://img.shields.io/badge/PostgreSQL-17-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" />
</p>

---

## What is KUNCI?

**KUNCI** is a fully autonomous AI Sales Development Representative (SDR) that automates outbound sales — from lead capture to personalized email conversations.

Instead of spending hours manually researching companies and crafting cold emails, KUNCI handles the entire pipeline automatically:

1. **Capture** a lead with basic info (name, email, company)
2. **Research** the company by scraping and analyzing their website
3. **Analyze** the lead's behavioral profile using AI
4. **Generate** a hyper-personalized 3-email nurturing sequence
5. **Send** emails on the optimal schedule
6. **Reply** intelligently when leads respond — keeping conversations going

All powered by LLMs through OpenRouter, with real email delivery via Resend.

---

## Features

- 🤖 **Autonomous Pipeline** — One-click lead capture triggers the full research → analyze → generate → send workflow
- 🧠 **8 Specialized AI Prompts** — Behavior analysis, website intelligence, email sequence generation, reply personalization, and more
- 📧 **3-Email Nurturing Sequences** — AI-generated with psychological triggers and multiple subject line variations
- 🔄 **Auto-Reply Handling** — Webhook-driven reply detection with AI-personalized responses sent in the same email thread
- ⏰ **Scheduled Follow-ups** — Cron-based daily follow-up processing at optimal send times
- 📊 **Dashboard** — Real-time stats on total leads, response rates, and conversion metrics
- 🔒 **End-to-End Type Safety** — Shared types from API to frontend via oRPC
- 🏗️ **Clean Architecture** — Domain-driven design with ports & adapters for testability and modularity

---

## Architecture

KUNCI is a pnpm monorepo with two apps and a clean separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Web)                    │
│  React 19 • TanStack Router • Vite 6 • Kana UI Kit  │
│              oRPC Client (type-safe RPC)             │
└────────────────────────┬────────────────────────────┘
                         │ /rpc/*
┌────────────────────────▼────────────────────────────┐
│                    Backend (API)                     │
│                      Hono 4.7                        │
│  ┌───────────────────────────────────────────────┐  │
│  │              Presentation Layer                │  │
│  │       oRPC Routers • Webhook Handlers          │  │
│  └──────────────────────┬────────────────────────┘  │
│  ┌──────────────────────▼────────────────────────┐  │
│  │              Application Layer                 │  │
│  │  Pipeline • Research • Email • Scheduler       │  │
│  └──────────────────────┬────────────────────────┘  │
│  ┌──────────────────────▼────────────────────────┐  │
│  │                Domain Layer                    │  │
│  │  Lead • EmailSequence • BehaviorAnalysis       │  │
│  │  Ports: AI • Email • Scraper • Cache • Logger  │  │
│  └──────────────────────┬────────────────────────┘  │
│  ┌──────────────────────▼────────────────────────┐  │
│  │             Infrastructure Layer               │  │
│  │  OpenRouter • Resend • Deepcrawl • Drizzle     │  │
│  │  Redis • Pino • Croner • MX Verifier           │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
         │              │              │
    PostgreSQL 17    Redis 7     OpenRouter API
```

### Pipeline Flows

**Flow 1 — Outbound (Lead → Email):**
```
Capture Lead → Scrape Website → AI Website Analysis → AI Company Profile
  → AI Behavior Analysis → AI Generate 3-Email Sequence → AI Convert to HTML
  → AI Pick Subject Line → Send via Resend → Track in DB
```

**Flow 2 — Reply Handling (Webhook → Auto-Reply):**
```
Resend Webhook → Find Lead → Get Next Sequence Template
  → AI Personalize Reply → AI Convert to HTML → Reply in Thread → Update Status
```

**Flow 3 — Scheduled Follow-ups (Cron):**
```
Daily 09:30 UTC → Find Leads Awaiting Reply → Send Next Email in Sequence
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9
- **Docker** (for PostgreSQL and Redis)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/kunci.git
cd kunci
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start infrastructure

```bash
docker compose -f docker-compose.dev.yml up -d
```

This starts:
- **PostgreSQL 17** on `localhost:5432`
- **Redis 7** on `localhost:6399`

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `REDIS_URL` | Redis connection string | ✅ |
| `OPENROUTER_API_KEY` | [OpenRouter](https://openrouter.ai) API key for LLM access | ✅ |
| `RESEND_API_KEY` | [Resend](https://resend.com) API key for email delivery | ✅ |
| `RESEND_WEBHOOK_SECRET` | Webhook signature verification secret | Optional |
| `SENDER_EMAIL` | Verified sender email address | ✅ |
| `SENDER_NAME` | Sender display name | ✅ |
| `DEEPCRAWL_API_KEY` | [Deepcrawl](https://deepcrawl.com) API key for web scraping | ✅ |
| `PORT` | API server port (default: `3001`) | Optional |
| `WEB_ORIGIN` | Frontend URL for CORS (default: `http://localhost:3000`) | Optional |

### 5. Initialize the database

```bash
pnpm db:push
```

### 6. Start development servers

```bash
# Start both API and Web concurrently
pnpm dev

# Or start individually
pnpm dev:api   # API on http://localhost:3001
pnpm dev:web   # Web on http://localhost:3000
```

---

## Usage

### Adding a Lead

1. Navigate to `http://localhost:3000/capture`
2. Fill in the lead's details (name, email, company, website)
3. Click **"Capture Lead"**
4. The AI pipeline runs automatically in the background

### Monitoring

- **Dashboard** (`/`) — Overview stats: total leads, awaiting replies, replied, conversion rate
- **Leads Pipeline** (`/leads`) — Full lead list with stage and status filters
- **Lead Detail** (`/leads/:id`) — Individual lead progress and email history

### Webhook Setup (for reply handling)

To enable automatic reply handling, configure a Resend webhook pointing to:

```
POST https://your-domain.com/webhooks/resend
```

Subscribe to `email.replied` and `email.received` events.

---

## Tech Stack

### Backend

| Technology | Role |
|---|---|
| [Hono](https://hono.dev) | Ultrafast web framework |
| [oRPC](https://orpc.unnoq.com) | End-to-end type-safe RPC |
| [Drizzle ORM](https://orm.drizzle.team) | Type-safe SQL ORM |
| [PostgreSQL](https://postgresql.org) | Primary database |
| [Redis](https://redis.io) (via ioredis) | Caching |
| [OpenRouter](https://openrouter.ai) | Multi-model LLM gateway |
| [Resend](https://resend.com) | Transactional email |
| [Pino](https://getpino.io) | Structured JSON logging |
| [Croner](https://github.com/Hexagon/croner) | Lightweight cron scheduler |
| [Zod](https://zod.dev) | Runtime validation |

### Frontend

| Technology | Role |
|---|---|
| [React 19](https://react.dev) | UI library |
| [Vite 6](https://vite.dev) | Build tool & dev server |
| [TanStack Router](https://tanstack.com/router) | Type-safe file-based routing |
| [TanStack Query](https://tanstack.com/query) | Server state management |
| [@kana-consultant/ui-kit](https://github.com/kana-consultant/kana-ui-kit) | Radix-based design system with dashboard blocks, OKLCH tokens & Tailwind v4 |
| [Tailwind CSS 4](https://tailwindcss.com) | Utility-first styling |
| [Lucide](https://lucide.dev) | Icon library |

### AI Models Used (via OpenRouter)

| Task | Model |
|---|---|
| Behavior Analysis | `openai/gpt-4o` |
| Email Sequence Generation | `openai/gpt-4o-mini` |
| Website Analysis | `openai/o3-mini` |
| Company Profile | `openai/gpt-4.1-mini` |
| HTML Conversion | `openai/gpt-4o-mini` |
| Reply Personalization | `openai/o3-mini` |
| Subject Line Selection | `openai/gpt-4o-mini` |

---

## Project Structure

```
kunci/
├── apps/
│   ├── api/                        # Backend (Hono + oRPC)
│   │   └── src/
│   │       ├── domain/             # Entities & port interfaces
│   │       │   ├── lead/           # Lead entity + repository interface
│   │       │   ├── email-sequence/ # Email sequence entity + repository
│   │       │   ├── behavior-analysis/
│   │       │   └── ports/          # AIService, EmailService, Cache, etc.
│   │       ├── application/        # Use cases (business logic)
│   │       │   ├── pipeline/       # Full outbound pipeline orchestrator
│   │       │   ├── research/       # Company research (scrape + AI)
│   │       │   ├── email/          # Send email & handle reply
│   │       │   ├── scheduler/      # Follow-up processing
│   │       │   └── use-cases.ts    # Composition root
│   │       ├── presentation/       # HTTP layer
│   │       │   ├── routers/        # oRPC route definitions
│   │       │   └── orpc/           # Middleware & context
│   │       ├── infrastructure/     # External service adapters
│   │       │   ├── ai/             # OpenRouter implementation
│   │       │   ├── db/             # Drizzle schema, client, repositories
│   │       │   ├── cache/          # Redis adapter
│   │       │   ├── email/          # Resend adapter
│   │       │   ├── scraper/        # Deepcrawl adapter
│   │       │   ├── scheduler/      # Croner setup
│   │       │   └── observability/  # Pino logger
│   │       ├── main.ts             # Server bootstrap
│   │       └── index.ts            # AppRouter type export
│   │
│   └── web/                        # Frontend (React + Vite)
│       └── src/
│           ├── routes/             # TanStack Router pages
│           │   ├── __root.tsx      # Layout with sidebar
│           │   ├── index.tsx       # Dashboard
│           │   ├── capture.tsx     # Lead capture form
│           │   └── leads/          # Lead list & detail pages
│           └── libs/
│               └── orpc/           # Type-safe oRPC client
│
├── docker-compose.dev.yml          # PostgreSQL + Redis
├── biome.json                      # Linter & formatter config
├── tsconfig.base.json              # Shared TypeScript config
├── pnpm-workspace.yaml             # Monorepo workspace config
└── package.json                    # Root scripts
```

---

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start both API and Web dev servers |
| `pnpm dev:api` | Start API server only |
| `pnpm dev:web` | Start Web dev server only |
| `pnpm build` | Build both apps for production |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:push` | Push schema changes to database |
| `pnpm db:studio` | Open Drizzle Studio (DB GUI) |
| `pnpm lint` | Run Biome linter across all packages |
| `pnpm test` | Run Vitest tests across all packages |
| `pnpm typecheck` | TypeScript type checking |

---

## API Reference

### oRPC Procedures (via `/rpc/*`)

| Procedure | Auth | Input | Description |
|---|---|---|---|
| `lead.capture` | Public | `{ fullName, email, companyName, companyWebsite, painPoints?, leadSource? }` | Capture lead and trigger full AI pipeline |
| `lead.list` | Protected | `{ page, limit, stage?, status? }` | List leads with pagination and filters |
| `lead.getDetail` | Protected | `{ id }` | Get full lead detail |
| `campaign.getStats` | Protected | — | Dashboard statistics |

### HTTP Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/healthz` | Liveness probe |
| `GET` | `/ready` | Readiness probe (Redis connectivity) |
| `POST` | `/webhooks/resend` | Resend webhook receiver |

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

This project uses [Biome](https://biomejs.dev) for linting and formatting:
- **Indent**: Tabs
- **Quotes**: Double
- **Semicolons**: As needed

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/your-org">KanA Consultant</a>
</p>
