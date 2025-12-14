# Issuance Service API

Base URL: `http://localhost:3000`

## Authentication

Currently unauthenticated for development. For production, secure the admin endpoints behind a gateway or add Basic/API-key auth.

## Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/health` | Returns service health, worker id, and runtime metrics summary. |
| POST | `/api/v1/credentials/issue` | Issues a new credential if it does not exist. |
| GET | `/admin/metrics` | Aggregated metrics for events, retry/dead-letter queues, worker id. |
| POST | `/admin/reprocess-failed` | Triggers replay of dead-lettered credential events. |

### POST `/api/v1/credentials/issue`

**Request Body**
```json
{
  "holderName": "Jane Doe",
  "credentialType": "University Degree",
  "issuerName": "Example University",
  "expiryDate": "2030-01-01",
  "metadata": { "program": "Computer Science" }
}
```

**Responses**
- `201 Created`
```json
{
  "success": true,
  "message": "Credential issued and published by worker-<id>",
  "credential": {
    "id": "uuid",
    "issueDate": "2024-01-01",
    "expiryDate": "2030-01-01",
    "holderName": "Jane Doe",
    "credentialType": "University Degree",
    "issuerName": "Example University",
    "workerId": "worker-host-1234",
    "timestamp": "2024-01-01T10:00:00.000Z"
  },
  "workerId": "worker-host-1234"
}
```
- `400 Bad Request` – Missing required fields.
- `409 Conflict` – Credential already exists for holder/type/issuer combination.
- `500 Internal Server Error` – Unexpected failure.

### GET `/admin/metrics`
Returns event/queue metrics:
```json
{
  "workerId": "worker-host-1234",
  "events": {
    "published": 10,
    "failed": 1,
    "retried": 2,
    "deadLettered": 0
  },
  "queues": {
    "retryQueueSize": 0,
    "deadLetterSize": 0,
    "status": "healthy"
  },
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```
