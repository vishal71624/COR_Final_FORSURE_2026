# ITRIX 2026: COMMIT OR ROLLBACK

A proctored DBMS event platform for hosting a two-round database competition.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19 and TypeScript
- **Styling**: Tailwind CSS v4 with Radix UI / Shadcn UI components
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL via `@supabase/supabase-js` and `@supabase/ssr`)
- **In-browser SQL Engine**: `@electric-sql/pglite` (WASM-based Postgres for Round 2)

## Project Structure

- `app/` — Next.js App Router pages
  - `page.tsx` — Main entry; switches views based on game state
  - `admin/page.tsx` — Organizer dashboard (questions, players, leaderboard)
- `components/` — Modular UI components
  - `round1-quiz.tsx` — MCQ round with proctoring and copy/paste blocking
  - `round2-editor.tsx` — SQL IDE with schema visualization and test cases
  - `leaderboard.tsx` — Live leaderboard with student/team views
  - `ui/` — Reusable Radix-based UI primitives
- `lib/` — Core business logic
  - `game-store.ts` — Central Zustand store managing the full event lifecycle
  - `sql-executor.ts` — pglite wrapper for schema setup and test case execution
  - `supabase/` — Database clients and server actions (`db-actions.ts`)
- `scripts/` — SQL migration files and seeding scripts

## Key Features

- **Two-round competition**: Round 1 is MCQ/scenario-based; Round 2 is a live SQL coding arena
- **Proctoring engine**: Monitors tab switches, fullscreen exits and Meta key; disqualifies on threshold; copy/paste/right-click blocked in both rounds
- **Checkpointing**: Saves player progress to Supabase every 10 seconds; auto-restores on reconnect
- **Team & individual leaderboard**: Real-time rankings with overall/round1/round2 tabs
- **Post-round redirect**: Completing Round 1 → leaderboard (Round 1 tab); completing Round 2 → leaderboard (Overall tab)
- **Team waiting room**: Syncs team members between rounds with 5-second countdown redirect to leaderboard when both finish
- **Submission guard**: Double-submit prevention via ref-based lock; loading spinner during PGlite test scoring; stale-closure-safe timer using answersRef
- **Logout confirmation**: Dashboard Exit button shows a confirmation dialog before logging out

## Environment Variables Required

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key

## Running the App

```bash
npm install
npm run dev
```

The dev server runs on port 5000 at `0.0.0.0` (configured for Replit).

## Configuration Notes

- `next.config.mjs` enables WASM support (for pglite) and sets `allowedDevOrigins` for Replit's proxy domains
- TypeScript build errors are ignored (`ignoreBuildErrors: true`) to allow faster iteration
