# Vultr Deployment Guide

AgentPayOps should be deployed on Vultr for Vultr award eligibility. Vercel can still be used for fast previews, but the final hackathon submission should include a Vultr-hosted public demo URL.

## Target Architecture

```text
GitHub
  -> Vultr VM
     -> Coolify or Docker Compose
        -> AgentPayOps Next.js container
        -> Postgres or managed database later
        -> Gemini API for finance reasoning
        -> X402 payment endpoint integration later
```

## Prerequisites

- Public GitHub repository: `https://github.com/anilandcode/AgentPayOps`
- Vultr account with hackathon credits activated
- A Vultr VM with Docker installed, or Coolify installed on the VM
- Optional now, required later: `GEMINI_API_KEY`

## Environment Variables

Use `.env.example` as the source of truth.

Required for the current demo:

```bash
GEMINI_MODEL=gemini-2.5-flash
NEXT_PUBLIC_APP_URL=https://your-vultr-domain.example
```

Optional for live Gemini reasoning:

```bash
GEMINI_API_KEY=your_key_here
```

Reserved for the next build steps:

```bash
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
X402_RECEIVING_ADDRESS=
X402_NETWORK=
```

## Deploy With Coolify

1. Create a Vultr VM.
2. Install Coolify using the Vultr workshop guide or Coolify docs.
3. Create a new application from the GitHub repository.
4. Select Dockerfile-based deployment.
5. Set the application port to `3000`.
6. Add environment variables from `.env.example`.
7. Deploy.
8. Confirm the health endpoint returns `ok`:

```bash
curl https://your-vultr-domain.example/api/health
```

## Deploy With Docker Compose

On the Vultr VM:

```bash
git clone https://github.com/anilandcode/AgentPayOps.git
cd AgentPayOps
cp .env.example .env
docker compose up -d --build
```

Verify:

```bash
curl http://localhost:3000/api/health
```

## Submission Notes

For the Vultr challenge, the submission should explicitly mention:

- The app is a web-based enterprise agent for finance operations.
- The Vultr VM hosts the production web app and API routes.
- The app demonstrates invoice intake, agentic payment decisions, policy enforcement, X402-style payment handling, Gemini finance reasoning, and audit logs.
- The health route is `/api/health`.
- The GitHub repository includes setup and deployment documentation.
