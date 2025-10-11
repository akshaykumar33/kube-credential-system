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

## 📊 Monitoring

Access admin endpoints:
- Queue Stats: `GET /admin/queue-stats`
- Health Check: `GET /health`
- Reprocess Failed: `POST /admin/reprocess-failed`

## 🛠️ Technology Stack

- **Backend**: Node.js, TypeScript, Express
- **Database**: SQLite (dev) / PostgreSQL (prod)  
- **Event Store**: Redis Pub/Sub + Streams
- **Frontend**: React + Vite
- **DevOps**: Docker, Kubernetes ready

Created by **Akshaykumar Patil** - Production-grade microservices architecture