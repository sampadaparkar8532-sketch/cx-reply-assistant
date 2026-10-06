# Datastraw CX Reply Assistant — Architecture

## Overview

The application is a multi-brand customer support workspace. Agents can view conversations and order information, retrieve brand-specific knowledge, generate AI-assisted replies, edit/regenerate/approve them, and send manual replies.

## Components

- React/Vite: agent interface.
- Node.js/Express: REST API and AI orchestration.
- MySQL: brands, customers, orders, conversations, messages, knowledge and AI audit records.
- OpenRouter: model provider.
- Current retrieval: MySQL keyword matching.
- Scale-up retrieval: Qdrant/vector search with brand metadata filtering.
- Future background processing: queue + workers for webhooks and asynchronous AI jobs.

## Multi-brand isolation

Every brand-owned entity contains `brand_id`. Knowledge retrieval always filters by `brand_id`, and conversation/order queries are joined through the current conversation's brand.

In production, authentication/authorization should resolve the user's permitted brands before data access. The frontend must never be trusted as the authorization boundary.

## AI reliability

Only retrieved brand-specific knowledge is supplied to the model. The prompt explicitly prohibits unsupported promises. When relevant knowledge is unavailable, the application recommends manual review.

Every generation stores customer message ID, retrieved context, AI response, edited response, final response, model, token counts and timestamp.

## Scaling from 20 to 500 brands

Likely pressure points are database load, AI spend/latency and knowledge retrieval. Indexes, connection pooling, caching and read replicas can improve database performance. Qdrant can replace keyword search for larger knowledge bases. AI calls can be routed by task complexity and processed through controlled workers.

## Reliability

Duplicate webhooks should use idempotency keys/external event IDs. External APIs should use timeouts and bounded retries with exponential backoff. AI failures should not block manual support. Outgoing messages should have pending/sent/failed states so failed sends can be retried without losing the response.

## Why keyword retrieval initially?

The assessment knowledge base is small. Keyword retrieval is transparent and avoids adding vector-database operational complexity. A production-scale knowledge base would benefit from embeddings and Qdrant.
