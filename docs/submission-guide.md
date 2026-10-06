# Assessment submission and demo guide

## Prepare the handoff

1. Keep the project source, `database/schema.sql`, `.env.example` files, and documentation together.
2. Do not include `node_modules`, `server/.env`, API keys, database passwords, or local database files in the handoff. The recipient can install dependencies from the lockfiles.
3. Include this README and the architecture notes. If the assessment asks for a live walkthrough, use the five-minute script in `demo-script.txt`.
4. Before sharing, copy the project to a clean folder and follow the setup below. This catches missing setup steps without relying on your existing local dependencies.

## Run it for review

Requirements: Node.js 18 or later and MySQL 8 or compatible MariaDB.

1. In MySQL, run `database/schema.sql` against a new, empty database. It recreates the assessment tables, so do not run it against data you need to keep.
2. Copy `server/.env.example` to `server/.env`. Set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` for the database you just prepared. `OPENROUTER_API_KEY` is optional; without it, the app uses its safe deterministic demo replies.
3. In one terminal, run `cd server`, `npm install`, then `npm run dev`. Confirm `http://localhost:5000/api/health` reports a connected database.
4. In a second terminal, run `cd client`, `npm install`, then `npm run dev`. Open `http://localhost:5173`.
5. Demonstrate both brands, the seeded conversation, message entry, reply generation, editing and approval, and knowledge base editing. Explain that approval adds the reply to the local conversation and does not send through a real support channel.

## What to provide

Provide the source folder as a ZIP (excluding dependency folders and secrets), the setup README, and any requested walkthrough or screenshots. If the assessor expects a hosted URL, deploy the API and database as well as the frontend, set the frontend API proxy/base URL for that deployment, and provide the URL and any required demo access details separately. The current configuration is for local review; it does not provision hosting or real messaging-channel credentials.
