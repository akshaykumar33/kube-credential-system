# Project Overview

## Services

| Path | Description |
| ---- | ----------- |
| `services/issuance-service` | REST API for issuing credentials, publishes Redis events. |
| `services/verification-service` | Subscribes to credential events, verifies credentials via REST. |
| `frontend/issuance-app` | React/Vite portal used by admins to issue credentials. |
| `kube-credential-k8s/` | Deployment manifests for Kubernetes clusters. |

## Data Flow

1. User fills the issuance form → frontend posts to issuance service.
2. Issuance service validates, writes to SQLite, publishes event to Redis.
3. Verification service subscribes to `credential-events`, persists copy, and exposes `/verify` API for consumers.
4. Admin endpoints expose metrics, queue sizes, and reprocessing utilities.

## Local Tooling

- Node.js 18+
- Docker / Docker Compose
- Redis 7 for pub/sub + queues

## Scripts

Run from repo root:

| Command | Purpose |
| ------- | ------- |
| `npm run dev:all` | Starts both backend services + available frontends via concurrently. |
| `npm run build:all` | Compiles TypeScript services + bundles frontend. |
| `npm run docker:up` | Builds and starts entire stack with Redis. |
| `npm run docker:down` | Stops stack and removes containers. |

See `docs/project/testing-strategy.md` for test commands.
