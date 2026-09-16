# Klyro

An embeddable AI chat widget that answers questions about its owner from a
vector-searched knowledge base. Next.js 14 App Router, Supabase Postgres with
pgvector, OpenAI `gpt-4o-mini`, and a dependency-free widget bundled by esbuild.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Next dev server on :3000 |
| `npm run build` | Builds the widget, then the Next app |
| `npm run build:widget` | esbuild the widget and copy the bundle into `public/` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `next lint` |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Vitest with v8 coverage over `src/lib` |

CI (`.github/workflows/ci.yml`) runs typecheck, lint and test on every pull
request. All three must be green before merging.

## Folder map

```
src/
  app/
    api/
      auth/          login, signup, logout, OTP send/verify
      chat/          the public widget endpoint (unauthenticated)
      conversations/ admin transcript reads
      cron/          scheduled jobs, gated on CRON_SECRET
      documents/     knowledge base CRUD, triggers ingestion
      metrics/       per-widget usage rollups
      persona/       persona config and presets
      profile/       account settings
      widget/        widget CRUD, public widget config, logo upload
    admin/           authenticated dashboard pages
    login/ signup/   auth pages
  components/
    admin/           sidebar, modals
    chat/            React wrapper around the widget
    3d/              landing page scene
  lib/
    ai/              rag.ts, embeddings.ts, calendly.ts, pricing.ts
    auth/            session.ts: signed session cookies
    db/              documents.ts, metrics.ts, ingestion-reaper.ts
    email/           SMTP + OTP
    external/        github.ts, portfolio.ts
    net/             fetch-with-timeout.ts
    security/        origin.ts, rate-limit.ts, random.ts
    supabase/        client.ts (browser + service role), server.ts (requireAuth)
  middleware.ts      route protection, Edge runtime
supabase/migrations/ numbered SQL, applied in order
widget/src/index.js  the embeddable widget, no dependencies
```

## How a chat request flows

1. **`widget/src/index.js` → `sendMessage()`** posts to `/api/chat` with
   `Accept: text/event-stream` and `{ stream: true }`. If the response is not
   SSE it falls back to reading JSON.
2. **`src/app/api/chat/route.ts`** validates the body, caps the message length,
   then rate limits by IP and by widget key
   (`src/lib/security/rate-limit.ts`) before touching any other table.
3. It loads the widget row, checks the request `Origin` against
   `allowed_domains` (`src/lib/security/origin.ts`, fails closed when a
   restricted widget sends no Origin), and refuses an ownerless widget.
4. It creates or validates a `chat_sessions` row, records the `origin`, loads
   the last 8 messages for context, and saves the user message.
5. **`src/lib/ai/rag.ts` → `generateResponse()`** rewrites the query for
   standalone search, embeds it (`src/lib/ai/embeddings.ts`), retrieves chunks
   via the `match_document_chunks` RPC scoped by `user_id`, re-ranks them on
   keyword overlap, and calls the model. Tools (GitHub, Calendly, URL fetch)
   may trigger a second answer call.
6. Answer tokens stream back through `onToken` as SSE `token` frames, then
   `sources`, then `done`.
7. The assistant message is persisted to `chat_messages` before `done` is sent,
   and `src/lib/db/metrics.ts` writes a `request_metrics` row fire-and-forget.

The buffered JSON path runs the same pipeline without `onToken`, and is what
any client that does not opt into streaming receives.

## Environment variables

Values live in `.env.local` and in the hosting provider. Names only:

**Required**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `SESSION_SECRET` — HMAC key for session cookies, at least 32 characters.
  Missing or short means every session is rejected and nobody can log in.
- `CRON_SECRET` — bearer token for `/api/cron/*`. Missing means the ingestion
  reaper refuses to run. It must also exist as a GitHub Actions repository
  secret, because the schedule lives in
  `.github/workflows/ingestion-reaper.yml` rather than in `vercel.json`:
  Vercel's Hobby plan only allows once-daily cron, and a more frequent
  entry in `vercel.json` makes Vercel reject the whole deployment.

**Optional**

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_GA_ID`
- `GITHUB_TOKEN` — raises the GitHub API rate limit for the projects tool
- `CHAT_RATE_LIMIT_PER_WIDGET_PER_MIN` (default 60)
- `CHAT_RATE_LIMIT_PER_IP_PER_MIN` (default 20)
- `CHAT_MAX_MESSAGE_LENGTH` (default 2000)

**Email (OTP and notifications)**

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`,
  `EMAIL_FROM`

## Rules

- **Never edit `.env` files.** If a change needs a new variable, print the exact
  key and let a human add it.
- **Secrets never reach logs or commits.** No keys, tokens, passwords or
  connection strings in `console.log`, in error messages, in test fixtures or in
  commit messages. `fetchWithTimeout` strips query strings from URLs before
  logging them for this reason.
- Do not weaken a check to make something work. The logos bucket was opened to
  `anon` "for troubleshooting" and stayed that way; see migration 019.
- Rate limiting and metrics fail open, authentication and tenant scoping fail
  closed. Keep it that way.

## Migrations

`supabase/migrations/NNN_snake_case_description.sql`, three-digit zero-padded,
applied in filename order. Take the next unused number; never renumber or edit a
migration that has already been applied, add a new one instead. Write them to be
re-runnable (`if not exists`, `drop policy if exists`) since they may be applied
against a database that is partly up to date.

Note that `005` exists twice (`005_add_user_isolation.sql` and
`005_standalone_users.sql`) from an earlier collision. Leave them alone.

## Things worth knowing

- **Auth is not Supabase Auth.** Sessions are a custom HMAC-signed cookie
  (`src/lib/auth/session.ts`). The browser Supabase client is always the `anon`
  role and never becomes `authenticated`, so RLS policies written against
  `authenticated` will not do what you expect.
- **Middleware runs on Edge.** Next 14 has no Node middleware runtime, so
  anything `src/middleware.ts` imports must avoid `node:crypto` and `Buffer`.
  That is why session signing uses Web Crypto.
- **Retrieval is scoped by `user_id`.** A null `filter_user_id` makes
  `match_document_chunks` search every tenant, so `retrieveRelevantChunks`
  throws rather than passing null.
- **The widget bundle is committed.** `widget/dist/` and `public/widget.js` are
  build output in git; run `npm run build:widget` after editing
  `widget/src/index.js` or the deployed widget will not match the source.
