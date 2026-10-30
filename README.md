<img width="2800" height="560" alt="webcraft-hero-banner (1)" src="https://github.com/user-attachments/assets/b145b13c-ee50-4716-a84b-5db7363430a5" />


AI-powered web application development platform that lets you create full Next.js applications by chatting with AI agents in real-time E2B sandboxes.

## Features

- 🤖 **AI Code Generation** — Conversational development with AI agents powered by Inngest agent-kit
- 🏗️ **Real-time Next.js Development** — AI agents build and iterate on apps inside E2B sandboxes
- 🔄 **Live Preview & Code View** — Split-pane resizable interface with Demo and Code tabs
- 📁 **File Explorer** — Browse generated files with a tree view and syntax highlighting (Prism.js)
- 💬 **Conversational UI** — Message history with automatic fragment selection and loading states
- 🎯 **Credit-based Usage** — Rate-limited credits (2 free / 100 pro) with 30-day reset window
- 💳 **Subscription Management** — Pro plan via Clerk PricingTable with tiered credit allocation
- 🔐 **Authentication** — Clerk-powered sign-in/sign-up with route protection
- ⚙️ **Background Processing** — Inngest orchestrates AI agent jobs asynchronously
- 🌓 **Theme Support** — Light, dark, and system themes via next-themes
- 🚀 **Project Templates** — Quick-start prompts for common apps (Netflix, Dashboard, Kanban, etc.


## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 15.3 (Turbopack) + React 19 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 + tw-animate-css |
| **UI Components** | Shadcn/ui (New York style) + Radix UI |
| **Icons** | Lucide React |
| **API Layer** | tRPC v11 (with TanStack React Query v5) |
| **Database** | PostgreSQL + Prisma ORM v6 |
| **Auth** | Clerk (with subscription/PricingTable) |
| **Background Jobs** | Inngest v3 |
| **AI Agent Framework** | @inngest/agent-kit |
| **AI Models** | Model-agnostic (OpenAI, Anthropic, Grok, etc.) |
| **Sandbox Runtime** | E2B Code Interpreter |
| **Forms** | React Hook Form + Zod |
| **Charts** | Recharts |
| **Toast Notifications** | Sonner |
| **Split Panels** | react-resizable-panels |
| **Syntax Highlighting** | Prism.js |

## How It Works

```mermaid
flowchart LR
    User[User] -->|Describes idea| Chat[Chat Interface]
    Chat -->|Sends event| Inngest[Inngest
 Background Job]
    Inngest -->|Spins up| Sandbox[E2B Sandbox
 Next.js 15]
    Sandbox -->|AI agent generates| Code[Code & Files]
    Sandbox -->|Dev server on :3000| Preview[Live Preview
 via iframe]
    Code -->|Saved to DB| Fragment[Fragment
 + Messages]
    Preview -->|Displayed in| UI[Split-Pane UI]
    Fragment -->|Browsable in| Explorer[File Explorer]
    User -->|Refines| Chat
```

1. **Describe** — User enters a prompt (or selects a template)
2. **Process** — Message is sent via Inngest to an AI agent running inside an E2B sandbox
3. **Generate** — The AI agent writes files and runs commands in the sandbox to build a Next.js app
4. **Preview** — The live sandbox URL is embedded as an iframe in the Demo tab
5. **Refine** — Users continue chatting to iterate, and the agent modifies the code
6. **Browse** — Generated files are viewable in the Code tab with a tree explorer

## Project Structure

```
src/
├── app/                      # Next.js App Router pages & layouts
│   ├── (home)/               # Public pages (home, pricing, sign-in, sign-up)
│   │   └── page.tsx          # Landing page with project form
│   ├── projects/             # Project detail (protected)
│   │   └── [projectId]/      # Dynamic project route
│   ├── api/                  # API routes (tRPC, Inngest)
│   ├── globals.css           # Tailwind & theme variables
│   └── layout.tsx            # Root layout (Clerk, TRPC, Theme)
├── components/               # Shared UI components
│   ├── ui/                   # shadcn/ui primitives
│   ├── code-view/            # Syntax-highlighted code viewer
│   ├── file-explorer.tsx     # File tree browser
│   ├── tree-view.tsx         # Recursive tree component
│   └── user-control.tsx      # User menu (avatar, sign out)
├── modules/                  # Feature modules
│   ├── home/                 # Landing page, navbar, project form, templates
│   ├── projects/             # Project view, messages, code preview, iframe
│   ├── messages/             # Message CRUD procedures
│   └── usage/                # Usage status procedures
├── inngest/                  # Background AI agent logic
│   ├── client.ts             # Inngest client
│   ├── functions.ts          # Code agent: orchestrates sandbox + agent-kit
│   ├── types.ts              # Constants
│   └── utils.ts              # Sandbox helpers, output parsers
├── lib/                      # Utilities
│   ├── db.ts                 # Prisma client singleton
│   ├── usage.ts              # Rate limiter (credits system)
│   └── utils.ts              # cn() helper, file-to-tree converter
├── hooks/                    # Custom React hooks
├── trpc/                     # tRPC client, server, router setup
│   ├── client.tsx            # React provider + TRPCReactProvider
│   ├── server.tsx            # Server-side fetch helpers
│   ├── init.ts               # tRPC initialization, auth middleware
│   ├── query-client.ts       # TanStack Query configuration
│   └── routers/_app.ts       # Router composition
├── middleware.ts             # Clerk auth middleware
├── prompt.ts                 # AI agent system prompts
└── types.ts                  # Shared types

prisma/
├── schema.prisma             # Database schema (Project, Message, Fragment, Usage)
└── migrations/               # Database migrations

sandbox-templates/
└── nextjs/                   # E2B Sandbox Docker config
    ├── e2b.Dockerfile        # Pre-installs Next.js 15 + all shadcn components
    └── compile_page.sh       # Starts dev server + compiles the page
```

## Architecture Overview

### AI Agent System

The code generation is powered by Inngest's **agent-kit** framework:

- **Code Agent** — A senior software engineer agent that operates inside an E2B sandbox with three tools:
  - `terminal` — Runs shell commands (npm install, diagnostics)
  - `createOrUpdateFiles` — Writes files to the sandbox filesystem
  - `readFiles` — Reads files from the sandbox
- **Fragment Title Generator** — Generates short titles for code fragments
- **Response Generator** — Wraps up results in a user-friendly message

The agent is **model-agnostic** — configure any OpenAI-compatible provider via `MODEL_URL`, `MODEL_NAME`, and `LINKAPI_KEY`.

### E2B Sandbox Lifecycle

1. A new sandbox is created on every run using a pre-built template (`vibe-nextjs-test-6`)
2. The sandbox has a 60-minute timeout
3. The Docker template pre-installs Next.js 15 + all shadcn/ui components
4. The AI agent writes code and the dev server (already running) hot-reloads
5. The sandbox URL is saved to the database and the UI polls for updates (via refetchInterval) to display it in an iframe

### Credit & Usage System

- **Free tier**: 2 credits per 30 days
- **Pro tier**: 100 credits per 30 days (via Clerk subscriptions)
- Each message sent to the AI agent consumes 1 credit
- Rate limiting is enforced via `rate-limiter-flexible` with Prisma storage

### Database Schema

- **Project** — Belongs to a user, has many messages
- **Message** — Either USER or ASSISTANT role; RESULT or ERROR type; optionally has one Fragment
- **Fragment** — Captures the sandbox URL, title, and generated files (JSON) per assistant message
- **Usage** — Rate limiter key-value store (points, expiry)

## Quick Start

### 1. Prerequisites

- **Node.js** 20+
- **PostgreSQL** database
- **Docker** (for building the E2B sandbox template)
- **E2B CLI** (`npm i -g @e2b/cli`)

### 2. Build E2B Template (Required)

```bash
# Login to E2B
e2b auth login

# Build the sandbox template
cd sandbox-templates/nextjs
e2b template build --name vibe-nextjs --cmd "/compile_page.sh"
```

After building, update the template name in `src/inngest/functions.ts`:

```typescript
const sandbox = await Sandbox.create("vibe-nextjs");
```

### 3. Set Up the App

```bash
# Install dependencies
npm install

# Configure environment
cp env.example .env
# Fill in all required variables (see below)

# Run database migrations
npx prisma migrate dev

# Start development server (with Inngest dev server)
npm run dev
```

Inngest dev server runs on port 8288 by default (`INNGEST_DEV=1`).

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vibe"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Inngest (dev mode enables local dev server)
INNGEST_DEV=1

# AI Model (OpenAI-compatible API)
LINKAPI_KEY="sk-..."       # Your API key (OpenAI, Anthropic, Grok, etc.)
MODEL_URL="https://api.openai.com/v1"  # Base URL for your model provider
MODEL_NAME="gpt-4o"       # Model identifier

# E2B Sandbox
E2B_API_KEY="e2b_..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/"
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack + Inngest |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run postinstall` | Generate Prisma client |
| `npx prisma studio` | Open database UI |
| `npx prisma migrate dev` | Apply schema changes |
| `npx prisma migrate reset` | Reset database (dev only) |

## Project Templates

The home page includes quick-start templates that auto-fill the prompt:

- 🎬 Netflix Clone — Dark-mode streaming homepage
- 📦 Admin Dashboard — Sidebar, stats, charts, tables
- 📋 Kanban Board — Drag-and-drop task management
- 🗂️ File Manager — Folder/file grid with CRUD
- 📺 YouTube Clone — Video grid with sidebar & modal
- 🛍️ Store Page — Product grid with cart logic
- 🏡 Airbnb Clone — Listings grid with filters
- 🎵 Spotify Clone — Music player with dark mode

---

Built with [Inngest Agent Kit](https://www.inngest.com/docs/agent-kit) · [E2B](https://e2b.dev) · [Clerk](https://clerk.com)
