# Operations & Deployment

## Local Environment

- Install dependencies: `npm run install:all`.
- Start Redis + services + frontends: `docker-compose up --build` or `npm run dev:all` for live reload.
- Environment variables:
  - `PORT` (default 3000/3001 per service)
  - `REDIS_HOST`, `REDIS_PORT`
  - `CORS_ORIGIN`
  - `LOG_LEVEL`

## Production Checklist

1. Build artifacts using `npm run build:all`.
2. Package services into container images (Dockerfiles already configured).
3. Deploy Redis (cluster or managed) with persistence and monitoring.
4. Apply Kubernetes manifests under `kube-credential-k8s/` (update image tags, secrets, resource limits).
5. Configure ingress/SSL and protect admin endpoints.
6. Wire monitoring:
   - Winston logs to centralized stack.
   - Redis INFO metrics -> Prometheus.
   - Add liveness/readiness probes hitting `/health`.

## Maintenance Routines

- **Redis queues**: monitor `credential-retry-queue`, `credential-dead-letter`, `verification-failed-events` for growth.
- **Database backup**: switch SQLite to external DB in production; schedule dumps.
- **Rolling updates**: rely on workerId logs + health endpoints to confirm zero-downtime.
- **Incident Response**: use `/admin/reprocess-failed` endpoints to replay events after outages.
