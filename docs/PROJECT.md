# Project Docs

This document explains the frontend structure and runtime flow.

## Overview

The app has two screens:

- `Login`
- `Kanban`

Routing is protected by auth state. If there is no token, users are redirected to `/login`.

## Main Modules

- `src/main.tsx`: app entry
- `src/App.tsx`: router + private route logic
- `src/store/auth.tsx`: auth context (`token`, `isAdmin`, `login`, `logout`)
- `src/api/client.ts`: shared fetch wrapper + bearer token + `401` handling
- `src/api/leads.ts`: lead CRUD requests
- `src/pages/Kanban.tsx`: board state, drag and drop, modals

## Drag and Drop

- Built with `@dnd-kit`
- Uses namespaced IDs to avoid collisions:
  - columns: `col-<id>`
  - cards: `lead-<id>`

> [!IMPORTANT]
> Keep this ID format if you change drag logic. Mixed numeric IDs can break target detection.

## Configuration

Values are read from Vite env variables:

- `VITE_API_BASE_URL`
- `VITE_STAGES`

`VITE_STAGES` must be a valid JSON array with `{ name, stageId }` objects.

> [!WARNING]
> If `VITE_STAGES` is invalid or stage IDs do not match backend records, board moves can fail or revert.

## API Flow

1. Login calls `POST /login`
2. Token is stored in `localStorage`
3. Board fetches leads per stage
4. Cross-column drag calls `PUT /crm/leads/:id` with new `stage_id`

> [!NOTE]
> On `401`, token is cleared and user is redirected to `/login`.

## UI Guidelines

- Keep styles minimal and consistent
- Prefer existing spacing, border, and text scales
- Use in-app modals for confirmations (avoid browser alerts)

## Code Quality

The project uses Biome with default rules (no custom rule overrides).

- `bun run lint`
- `bun run format`
- `bun run check`

> [!TIP]
> Run `bun run format` before commits to keep diffs small and consistent.
