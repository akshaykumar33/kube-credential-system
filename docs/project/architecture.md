# System Architecture

```mermaid
digraph G {
  rankdir=LR
  IssuanceService [label="Issuance Service\nExpress + Redis Publisher"]
  Redis [label="Redis\nPub/Sub + Sorted Sets"]
  VerificationService [label="Verification Service\nExpress + Redis Subscriber"]
  Frontend [label="Issuance Frontend\nReact/Vite"]
  DB1 [label="SQLite\nissuance-service/data"]
  DB2 [label="SQLite\nverification-service/data"]

  Frontend -> IssuanceService [label="REST /issue"]
  IssuanceService -> DB1 [label="Persist"]
  IssuanceService -> Redis [label="publish credential-events"]
  Redis -> VerificationService [label="subscribe credential-events"]
  VerificationService -> DB2 [label="store"]
  VerificationService -> Admin [label="metrics"]
}
```

## Components

- **Issuance Service** – REST API that validates credential requests, stores them locally, and publishes `CREDENTIAL_ISSUED` events. Includes retry queue, dead-letter handling, metrics.
- **Verification Service** – Subscribes to Redis events, stores verified credentials, exposes verification REST API and admin metrics endpoints.
- **Frontend Issuance App** – React/Vite single-page app for issuing credentials that communicates with the issuance service.
- **Redis** – central message broker; also stores retry queues (`zset`), dead-letter queue (`list`), and monitoring hashes.

## Reliability Mechanisms

- **Retry Queue** – Failed publish attempts added to `credential-retry-queue` with exponential backoff.
- **Dead Letter Queue** – Events exceeding retries moved to `credential-dead-letter` for manual reprocessing.
- **Verification Failed Queue** – Subscriber errors persisted in `verification-failed-events` list.
- **Metrics Keys** – `metrics:events:*` and `metrics:verification:*` provide aggregated counters.

## Deployment

- Docker Compose spins up Redis, issuance, verification, and optional frontends.
- Kubernetes manifests (in `kube-credential-k8s/`) mirror this topology with readiness/liveness probes.
- All services expose `/health` endpoints for orchestration probes.
