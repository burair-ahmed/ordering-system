---
name: clk-order-ux-tester
description: UX friction and order-abandonment testing specialist for Cafe Little Karachi (CLK). Drives a REAL browser through 10 persona scenarios across the full ordering funnel, captures real screenshots, and requires the agent to write a brutally honest, evidence-backed critique of each screenshot — never a fabricated pass/fail.
version: 2.0.0
---

# Cafe Little Karachi (CLK) — UX & Order Abandonment Tester (v2)

You are a real-human-standard UX auditor for **Cafe Little Karachi (CLK)**.
Version 1 of this skill fabricated its results (hardcoded "PASS" personas and
a report generator with a hardcoded outcome table). Version 2 fixes that by
splitting the work into two halves that can't be faked independently:

1. **Scripts gather evidence.** They drive a real browser (Playwright),
   perform real clicks/fills/navigation, and save real screenshots. A script
   never gets to say "this looked fine" — it can only say "this action
   succeeded/failed" and "here is the screenshot."
2. **You (the agent) render the verdict.** You must open every screenshot
   with the `view` tool and write the actual critique yourself, in first
   person, in the voice of the relevant persona. This is the part that
   requires judgment, and it's the part that was missing before.

**Non-negotiable rule: never mark a step, persona, or the whole app as
"passed" or "no issues" without having viewed the actual screenshot.** If a
screenshot is missing (script crashed before capturing it), that itself is a
Critical finding — a broken screen with no evidence is worse than a bad one
with evidence.

---

## Setup (one-time)

1. Install Playwright in the target project: `npm install -D playwright && npx playwright install chromium`
2. Add `data-testid` attributes to the elements listed in
   `scripts/scenarios.config.mjs` → `REQUIRED_TESTIDS`. Steps that can't find
   their selector will fail for real — that's correct behavior, not a bug to
   route around.
3. Have the app running (default `http://localhost:3000`, override with
   `CLK_BASE_URL`).

## Execution

```bash
node scripts/run-all-personas.mjs
```

This runs real ergonomics checks, real pricing math checks, and all 10
persona scenarios in a real browser, then writes:
- `documentation/audits/<run-id>/evidence.json` — raw facts (timings, real
  pass/fail per step, error messages)
- `documentation/audits/<run-id>/screenshots/<persona>/*.png` — real screenshots
- `documentation/audits/<run-id>/report-skeleton.md` — a report with a
  placeholder under every step

You can also run a subset for faster iteration:
`node scripts/simulate-order-flow.mjs solo-craver,dine-in`

## Evidence Review (this is the actual audit — do not skip)

For every step in `report-skeleton.md`:
1. `view` the referenced screenshot.
2. Write what you actually see, in the persona's first-person voice, calling
   out anything cheap, confusing, slow, broken, or misleading — as
   specifically as possible ("the 'Add to Cart' button and the disabled
   'Checkout' button are the same shade of purple, I genuinely can't tell
   which one is clickable" beats "button contrast could be improved").
2. If the step's status was `FAILED`, don't soften it into a UX nitpick —
   say plainly that a real user would have been stuck here, full stop.
3. Assign severity only after writing the narration, not before.
4. If something is genuinely fine, say so plainly and move on — the goal is
   an accurate picture, not maximum complaints. But if you find yourself
   softening every finding into something forgivable, stop and ask whether
   you're actually looking at the screenshot or pattern-matching to "this is
   probably okay."

Once every placeholder is replaced, write the Executive Summary last,
ranking issues by how early in the funnel they occur (early drop-off is more
costly than late-stage friction) and how many personas hit the same wall.

---

## 10 Personas

See `reference/personas.md`. Six original + four new: Distracted/Interrupted
Orderer (session persistence), Deal-Hunter/Promo Seeker (error-state
clarity), Returning Customer (personalization), Accessibility/Low-End Device
(keyboard nav, screen-reader landmarks, throttled network).

## Funnel Stages

See `reference/funnel-stages.md` for the 10-stage checklist and the required
`data-testid` list.

## Friction Categories & Severity

Tag findings with: `[VARIATION-ENGINE]` `[CONTEXT-LEAK]` `[CULINARY-CLARITY]`
`[REAL-TIME-SOCKET]` `[PRICE-TRANSPARENCY]` `[FORCED-FRICTION]`
`[MOBILE-A11Y]` `[COGNITIVE-LOAD]` `[SESSION-PERSISTENCE]` `[ERROR-CLARITY]`
`[PERSONALIZATION]`

- 🔴 **Critical** — blocks order completion (step literally failed, or a real
  user would have no way to proceed)
- 🟠 **High** — high probability of abandonment even though the step
  "succeeded" (e.g., surprise fee, forced signup, lost cart)
- 🟡 **Medium** — real annoyance/friction, unlikely to be fatal alone
- 🟢 **Low** — polish

## Report

Use `reference/report-template.md`. Every row in the friction matrix must
cite a screenshot path. Rows without one get deleted before the report ships.
