# DeliverMate AI

DeliverMate AI is an AI-assisted delivery workbench for turning raw customer materials into structured project outputs.

The app helps a delivery consultant, project assistant, product manager, or implementation team move from:

```text
Interview notes / meeting minutes / business context / scattered requirements
-> structured AI analysis
-> editable delivery documents
-> knowledge base and follow-up Q&A
```

## Current scope

DeliverMate currently supports:

- Text material intake
- PDF / DOCX upload and text extraction
- AI material analysis
- Requirements document generation
- Function list generation
- Test case generation
- UAT table generation
- Training manual generation
- Document editing and Markdown export
- Local knowledge-base sync
- AI chat grounded in materials, generated docs, and knowledge chunks

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Prisma
- SQLite
- Vitest

## AI architecture

The current recommended pipeline is:

```text
Raw material
-> LLM extracts structured JSON
-> local schema validation
-> local document rendering
```

This keeps factual extraction and document formatting separated, which reduces brittle direct Markdown generation.

## Environment

Copy `.env.example` to `.env` and fill in real values:

```env
DATABASE_URL="file:./dev.db"
AI_PROVIDER="deepseek"
DEEPSEEK_API_KEY="your-api-key"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_MODEL="deepseek-v4-flash"
NEXT_PUBLIC_APP_NAME="DeliverMate AI"
```

Optional MetaGPT bridge mode:

```env
AI_PROVIDER="metagpt"
METAGPT_PYTHON_PATH="python"
METAGPT_BRIDGE_SCRIPT="scripts/metagpt_bridge.py"
METAGPT_TIMEOUT_MS="180000"
METAGPT_ALLOW_DEEPSEEK_FALLBACK="true"
METAGPT_BACKEND="mock"
```

## Local development

Install dependencies and initialize the database:

```bash
npm install
npm run db:generate
npm run db:migrate
```

Start locally:

```bash
npm run dev
```

Open:

- [http://localhost:3000](http://localhost:3000)

To expose the dev server on your local network:

```bash
npm run dev:network
```

Then access it with your machine's real LAN IP, for example:

- `http://192.168.x.x:3000`

## Validation

```bash
npm test
npm run lint
npm run build
```

## Project structure

- `src/app/`
  Next.js app routes and API routes
- `src/components/`
  UI shell, workbench, and knowledge-base clients
- `src/lib/ai/`
  AI provider abstraction, schemas, renderers, and bridge logic
- `src/lib/knowledge-base.ts`
  Knowledge asset synchronization, chunking, and retrieval
- `src/lib/rag.ts`
  Chunking and keyword extraction utilities
- `prisma/`
  Database schema and seed data
- `docs/`
  Specs, plans, and implementation notes

## Roadmap

Near-term priorities:

- Multiplayer collaboration
- Workspace and member permissions
- Comments and review workflow
- Document version history
- Approval / handoff flow

See:

- [Multiplayer collaboration plan](./docs/superpowers/plans/2026-05-05-multiplayer-collaboration.md)

## Notes

- The app currently uses SQLite for local development.
- Build output still shows one existing `metagpt`-related Turbopack tracing warning; this is known and not introduced by the current UI work.
