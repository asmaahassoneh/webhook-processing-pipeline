# Webhook-Driven Task Processing Pipeline

A TypeScript service that receives incoming webhooks, stores them as background jobs, processes them asynchronously, and delivers the processed result to subscriber URLs.

## Features

- Pipeline CRUD API
- Webhook ingestion endpoint
- Background worker
- PostgreSQL-backed job queue
- Multiple processing actions:
  - uppercase_text
  - reverse_text
  - add_metadata
  - append_suffix
- Delivery retry logic
- Job history and delivery attempts
- Manual job retry endpoint
- API key authentication
- Webhook signature verification
- Docker Compose setup
- GitHub Actions CI

## Architecture

- **API service** handles pipeline management, webhook ingestion, and job queries.
- **Worker service** continuously polls pending jobs from PostgreSQL and processes them.
- **Database** stores pipelines, subscribers, jobs, and delivery attempts.

## Run locally

```bash
npm install
npm run migrate
npm run dev
```
Run worker in another terminal:

```bash
npm run worker
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

## Create pipeline
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
  "subscribers": [
    { "targetUrl": "https://example.com/webhook-receiver" }
  ]
}
```

## Trigger webhook
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
