# 🚀 Kube Credential System - Redis Pub/Sub Edition

A production-grade microservices credential system with **Redis pub/sub + retry queue**.

## 🏗️ Architecture

```
┌─────────────────┐    Publish    ┌─────────────────┐    Subscribe    ┌─────────────────┐
│ Issuance Service│──────────────▶│   Redis PubSub  │────────────────▶│Verification Svc │
│   Issue + Event │               │                 │                 │  Process Event  │
└─────────────────┘               │   ┌─────────┐   │                 └─────────────────┘
                                  │   │ Retry   │   │                          │
                                  │   │ Queue   │   │                          │
                                  │   │ (Redis) │   │                          │
                                  │   └─────────┘   │                          │
                                  └─────────────────┘                          │
                                           ▲                                   │
                                           └───────── Failed Events ──────────┘
```

## 🚀 Quick Start

```bash
# Start everything with Docker
docker-compose up --build

# Or run manually for development
npm run dev:all

# Access the applications
- Issuance Service: http://localhost:3000
- Verification Service: http://localhost:3001
- Issuance Frontend: http://localhost:3002  
- Verification Frontend: http://localhost:3003
- Redis: localhost:6379
```

## 🎯 Features

- ✅ **Real-time event synchronization**
- ✅ **Automatic retry with exponential backoff**
- ✅ **Dead letter queue for failed events**
- ✅ **Circuit breaker pattern**
- ✅ **Complete monitoring & observability**
- ✅ **Event sourcing & audit trail**
- ✅ **Production-ready Docker deployment**

## 📋 How It Works

### Credential Issuance:
1. Store credential in local database
2. Publish `CREDENTIAL_ISSUED` event to Redis
3. If publish fails → Add to retry queue
4. Background worker processes retry queue

### Credential Verification:
1. Subscribe to Redis events
2. Process received credentials
3. Store in verification database
4. If processing fails → Add to failed queue

## 🔧 Development

```bash
# Install dependencies
npm run install:all

# Run services individually
cd services/issuance-service && npm run dev
cd services/verification-service && npm run dev
cd frontend/issuance-app && npm run dev
cd frontend/verification-app && npm run dev
```

### ✅ Test Suite

```bash
npm run test:issuance           # Jest unit tests for issuance service
npm run test:verification       # Jest unit tests for verification service
npm run test:issuance-app       # Vitest + RTL tests for issuance frontend
npm run test:verification-app   # Vitest + RTL tests for verification frontend
npm run test:all                # Run every suite sequentially
npm run test:coverage           # Combined coverage reports
```

- Backend tests live in `services/<service>/src/__tests__` and mock Redis/SQLite dependencies.
- Frontend tests live in `frontend/<app>/src/__tests__` with jsdom + Testing Library.

## 📊 Monitoring

Access admin endpoints:
- Queue Stats: `GET /admin/queue-stats`
- Health Check: `GET /health`
- Reprocess Failed: `POST /admin/reprocess-failed`

## 📚 Documentation

Extended docs now live under [`docs/`](./docs):
- `docs/api/*.md` – Endpoint specs for issuance & verification services
- `docs/project/architecture.md` – System diagram and reliability notes
- `docs/project/testing-strategy.md` – Details on the unified test suite
- `docs/project/operations.md` – Deployment & maintenance checklist
- `docs/api/specs/*.openapi.yaml` – **Source of truth OpenAPI specs rendered through Scalar + Swagger**

### API Docs with Scalar + Swagger

Every backend service must expose an OpenAPI 3 spec located in `docs/api/specs`. Use these commands to work with them:

```bash
# Preview Scalar + Swagger for both services
npm run docs:preview

# Individual renderers
npm run docs:scalar
npm run docs:swagger
```

- Scalar hosts issuance (port 4000) and verification (port 4001) references with hot reload.
- Swagger hosts issuance on port 3210 and verification on port 3211.

The Markdown files under `docs/api/*.md` should summarize the same endpoints while the OpenAPI files power interactive docs.

## 🛠️ Technology Stack

- **Backend**: Node.js, TypeScript, Express
- **Database**: SQLite (dev) / PostgreSQL (prod)  
- **Event Store**: Redis Pub/Sub + Streams
- **Frontend**: React + Vite
- **DevOps**: Docker, Kubernetes ready

Created by **Akshaykumar Patil** - Production-grade microservices architecture