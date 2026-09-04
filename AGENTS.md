# Advanced Ordering Ecosystem — Agent Rules

## Project Context

This is the **Advanced Ordering Ecosystem**, a monorepo workspace containing two production-grade restaurant ordering platforms:

- **`cafe-little-karachi/`** — Cafe Little Karachi (CLK): Premium dining platform with granular item variation engine, dine-in table management, and real-time order tracking.
- **`the-chai-company/`** — The Chai Company (TCC): High-speed quick-service cafe ordering platform with optimized cart UX and platter management.

## Tech Stack
- **Framework**: Next.js 15 (Hybrid App Router + Pages Router)
- **Database**: MongoDB + Mongoose ODM
- **Real-Time**: Socket.IO
- **Styling**: Tailwind CSS + Framer Motion + GSAP
- **Notifications**: Twilio (WhatsApp)
- **Validation**: Zod + TypeScript
- **Analytics**: PostHog + Google Analytics

## Key Rules
1. Always read `documentation/NEXT_STEPS.md`, `documentation/status.md`, and `documentation/memory.md` before starting any task.
2. Always identify which sub-project (CLK or TCC) you are working in before writing code.
3. Each sub-project has its own `docs/` folder for project-specific documentation.
4. The root `documentation/` folder contains monorepo-level specs and tracking.
5. Update `documentation/status.md` and `documentation/memory.md` after every completed task.
6. **Strict Micro-Change Documentation Rule (MANDATORY)**: Even the smallest micro-changes (e.g., polling interval adjustments, button additions, fallback parameters, error handling tweaks, or style updates) MUST be strictly and immediately documented in `documentation/memory.md`, `documentation/status.md`, and the relevant documentation notes with exact file paths and rationale. Undocumented changes are strictly prohibited.

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
