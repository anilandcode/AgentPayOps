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
        -> Optional real X402 payment settlement for vendor-risk data
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

Required for Supabase persistence:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Optional for real X402 settlement:

```bash
X402_MODE=real
X402_RECEIVING_ADDRESS=
EVM_ADDRESS=
X402_NETWORK=eip155:84532
X402_VENDOR_REPORT_PRICE=0.42
X402_FACILITATOR_URL=https://facilitator.x402.org
```

Keep `X402_MODE=demo` for the browser-based hackathon walkthrough unless you have an X402-capable client ready to pay the protected endpoint.

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

Confirm the payment mode:

```bash
curl https://your-vultr-domain.example/api/x402/status
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
- The app demonstrates invoice intake, agentic payment decisions, policy enforcement, X402-style or real X402 payment handling, Gemini finance reasoning, and audit logs.
- The health route is `/api/health`.
- The GitHub repository includes setup and deployment documentation.
