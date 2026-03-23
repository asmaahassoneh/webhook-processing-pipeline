# Webhook-Driven Task Processing Pipeline

A TypeScript service that receives incoming webhooks, stores them as background jobs, processes them asynchronously, and delivers the processed result to subscriber URLs.

This project also includes a lightweight dashboard UI for managing pipelines, viewing jobs, inspecting delivery attempts, and retrying failed jobs.

## Features

- Pipeline CRUD API
- Webhook ingestion endpoint
- Background worker
- PostgreSQL-backed job queue
- Multiple processing actions:
  - `uppercase_text`
  - `reverse_text`
  - `add_metadata`
  - `append_suffix`
- Delivery retry logic
- Job history and delivery attempts
- Manual job retry endpoint
- API key authentication
- Webhook signature verification
- Dashboard UI for monitoring and management
- Docker Compose setup
- GitHub Actions CI

## Architecture

- **API service** handles pipeline management, webhook ingestion, job queries, metrics, and retry operations.
- **Worker service** continuously polls pending jobs from PostgreSQL and processes them asynchronously.
- **Database** stores pipelines, subscribers, jobs, and delivery attempts.
- **Dashboard UI** provides a simple interface for creating pipelines, viewing jobs, checking attempts, and retrying failed jobs.

## Run locally

### Backend

```bash
npm install
npm run migrate
npm run dev
```

Run worker in another terminal:

```bash
npm run worker
```

## Frontend UI

```bash
cd client
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

Backend runs at:

```
http://localhost:3000
```

## Run with Docker

```bash
docker compose up --build
```

## Environment variables

### Local

```env
PORT=3000
DATABASE_URL=postgres://postgres:2004@localhost:5434/webhook_pipeline
API_KEY=dev-secret-key
```

### Docker

```env
PORT=3000
DATABASE_URL=postgres://postgres:2004@db:5432/webhook_pipeline
API_KEY=dev-secret-key
```

## Auth

Protected endpoints require:

```http
x-api-key: dev-secret-key
```

The dashboard UI uses this API key to communicate with the backend.

## Dashboard UI

The project includes a small dashboard for interacting with the system visually.

### What you can do in the UI

- View overall job metrics
- Create pipelines
- View pipeline details
- View jobs by pipeline
- Inspect job payloads and delivery attempts
- Retry failed jobs

### Main sections

- **Overview**: shows job metrics and recent jobs
- **Pipelines**: create and manage pipelines, inspect source keys and subscribers
- **Jobs**: inspect all jobs, payloads, errors, and retry failed jobs

---

## Create pipeline

You can create a pipeline either through the API or through the dashboard UI.

### API example

```http
POST /pipelines
x-api-key: dev-secret-key
Content-Type: application/json
```

```json
{
  "name": "Uppercase pipeline",
  "actionType": "uppercase_text",
  "actionConfig": {
    "field": "text"
  },
  "webhookSecret": "my-secret",
  "subscribers": [{ "targetUrl": "https://example.com/webhook-receiver" }]
}
```

## Trigger webhook

### API example

```http
POST /webhooks/:sourceKey
x-webhook-signature: <sha256 hmac hex>
Content-Type: application/json
```

```json
{
  "text": "hello world"
}
```

### Example with curl

```bash
curl -X POST http://localhost:3000/webhooks/YOUR_SOURCE_KEY \
  -H "Content-Type: application/json" \
  -d '{"text":"hello world"}'
```
