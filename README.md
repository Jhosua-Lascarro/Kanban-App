# Kanban App

Simple React frontend for a Flask/Odoo CRM backend.

## Stack

- Vite
- React + TypeScript
- Tailwind CSS v4
- @dnd-kit (drag and drop)

## Requirements

- Bun 1.x or Node.js 20+
- Running backend API

> [!NOTE]
> The app expects JWT auth from the backend and stores the token in `localStorage` as `kanban_token`.

## Quick Start

```bash
bun install
bun run dev
```

Dev server: `http://localhost:5173`

## Environment

Copy `.env.example` to `.env`.

```env
VITE_API_BASE_URL=http://127.0.0.1:5000/api
VITE_STAGES=[{"name":"New","stageId":1},{"name":"Qualified","stageId":2},{"name":"Proposition","stageId":3},{"name":"Won","stageId":4}]
```

- `VITE_API_BASE_URL`: backend base URL
- `VITE_STAGES`: JSON array of board columns

> [!WARNING]
> `stageId` values must match real Odoo stage IDs. Wrong values break stage updates on drag and drop.

## Commands

```bash
bun run dev      # start dev server
bun run build    # production build
bun run preview  # preview build
bun run lint     # biome lint
bun run format   # biome format --write
bun run check    # biome check (lint + format diagnostics)
```

## Core Behavior

- Login saves JWT token
- Board loads leads by configured stages
- Drag in same column reorders locally
- Drag across columns updates `stage_id` via API
- Create/Edit/Delete actions use in-app modals

## Documentation

- See `docs/PROJECT.md` for architecture and flow details.
