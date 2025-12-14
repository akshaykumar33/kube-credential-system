# Verification Service API

Base URL: `http://localhost:3001`

## Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/health` | Returns service status, worker id, and event subscriber metrics. |
| POST | `/api/v1/credentials/verify` | Verifies a credential by id. |
| GET | `/admin/metrics` | Combines event subscriber health with verification service status. |
| GET | `/admin/synced-credentials?limit=10` | Returns most recently synced credentials from Redis timeline. |
| GET | `/admin/event-status` | Event subscriber health, queue depth, dedupe cache size. |
| POST | `/admin/reprocess-failed` | Replays failed verification events from Redis list. |

### POST `/api/v1/credentials/verify`

**Request**
```json
{
  "id": "credential-uuid"
}
```

**Responses**
- `200 OK` when credential exists:
```json
{
  "success": true,
  "message": "Credential verified by worker-<id>",
  "credential": { "id": "credential-uuid", "holderName": "Jane" },
  "workerId": "worker-host-1234",
  "timestamp": "2024-01-01T10:00:00.000Z",
  "isValid": true
}
```
- `404 Not Found` when credential missing:
```json
{
  "success": false,
  "message": "Credential with ID credential-uuid not found or invalid",
  "workerId": "worker-host-1234",
  "timestamp": "2024-01-01T10:00:00.000Z",
  "isValid": false
}
```
- `400 Bad Request` if payload missing `id`.
- `500 Internal Server Error` on unexpected failure.

### `GET /admin/event-status`
Example response:
```json
{
  "success": true,
  "eventSubscriber": {
    "isListening": true,
    "processedSuccess": 120,
    "processedFailed": 3,
    "failedQueueSize": 0,
    "processedEventsInMemory": 450
  },
  "timestamp": "2024-01-01T11:00:00.000Z"
}
```

### `POST /admin/reprocess-failed`
Manually replays events stored in `verification-failed-events` list.
```json
{
  "success": true,
  "message": "Reprocessed 4 failed events",
  "reprocessedCount": 4,
  "timestamp": "2024-01-01T11:05:00.000Z"
}
```
