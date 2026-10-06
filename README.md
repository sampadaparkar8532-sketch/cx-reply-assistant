# AI-Powered CX Reply Assistant

React + Node.js + Express + MySQL implementation for the Datastraw Technologies assessment.

## Features

- Customer/Agent conversation toggle
- Customer, brand and order information
- Conversation history
- Manual customer/agent messages
- Two brands with different policies
- Knowledge Base CRUD
- Brand-scoped knowledge retrieval
- AI reply generation through OpenRouter
- Safe fallback when AI is unavailable
- Guardrails against unsupported policy promises
- Retrieved context displayed to the agent
- Regenerate / edit / approve / send workflow
- AI generation audit logging
- Mock data and MySQL seed script

## Requirements

- Node.js 18+
- MySQL 8+ (or compatible MySQL/MariaDB)
- Optional OpenRouter API key for real AI generation

## 1. Database

Create a new, empty database and seed data:

```sql
SOURCE database/schema.sql;
```

Run this only against a new/empty database: `database/schema.sql` drops and recreates the assessment tables before seeding them. Do not run it against a database containing data you need.

## 2. Backend

```bash
cd server
npm install
```

Copy `.env.example` to `.env` and configure MySQL.

```bash
npm run dev
```

Backend:

http://localhost:5000

Health check:

http://localhost:5000/api/health

## 3. Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Frontend:

http://localhost:5173

## 4. OpenRouter

For real AI replies, add:

```env
OPENROUTER_API_KEY=your_key
OPENROUTER_MODEL=your_model
```

If no API key is configured, the app still works in demo mode using a deterministic safe reply generator. This allows the application and assessment flow to be tested without an API key.

## Important demo flow

1. Open the app.
2. Select GlowCare.
3. Open the seeded conversation.
4. Send a customer message such as:
   `My order was delivered but the bottle is broken. What can I do?`
5. Click Generate Reply.
6. Inspect the retrieved knowledge.
7. Edit/regenerate/approve/send.
8. Open Knowledge Base and change a policy.
9. Generate again to verify the changed policy is used.
10. Switch to PureHome and ask the same return-policy question.
11. Verify PureHome's 14-day policy is retrieved instead of GlowCare's 7-day policy.
12. Test an unsupported question such as:
    `Does this product contain peanuts?`
    The system should recommend manual review rather than inventing an answer.

## API

### Brands

GET `/api/brands`

### Knowledge Base

GET `/api/brands/:brandId/knowledge`

POST `/api/brands/:brandId/knowledge`

PUT `/api/knowledge/:id`

DELETE `/api/knowledge/:id`

### Conversations

GET `/api/conversations`

GET `/api/conversations/:id`

POST `/api/conversations/:id/messages`

POST `/api/conversations/:id/generate-reply`

POST `/api/ai/:id/regenerate`

POST `/api/ai/:id/approve`

## Architecture

See `docs/architecture.md` and `docs/architecture.txt`.

## Assessment handoff

Follow [the submission and demo guide](docs/submission-guide.md) to prepare a clean copy, configure it, run the demo, and package it for review. The “Approve & Send” action records the approved reply in the local conversation; this assessment build does not connect to a real customer messaging channel.

## Security note

This assessment build uses a simple local/demo authentication model. For production, add real authentication and authorization and enforce tenant/brand access at the backend/database layer.

## Production improvements

- PostgreSQL/Supabase
- Qdrant vector retrieval
- Redis caching
- Queue/worker processing
- Webhook idempotency
- Proper authentication and RBAC
- Observability and AI cost monitoring
