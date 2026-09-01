#!/usr/bin/env node
/**
 * simulate-order-flow.mjs
 *
 * Runs all 10 real persona scenarios against a live app using Playwright.
 * Produces a JSON evidence file + a folder of real screenshots per persona/step.
 *
 * This script makes NO judgment calls about whether the UX is good ("pass"/"fail"
 * on friction) — it only records what actually happened (did the action succeed,
 * how long did it take, what did the screen look like). Judging whether that
 * screenshot represents good or bad UX is done afterward by an agent actually
 * looking at the images — that's the "brutal review" step, and it can't be
 * faked by a script.
 */

import { scenarios } from './scenarios.config.mjs';
import { runScenario } from './browser-runner.mjs';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.CLK_BASE_URL || 'http://localhost:3000';
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const SCREENSHOT_ROOT = path.resolve(process.cwd(), `documentation/audits/${RUN_ID}/screenshots`);

export async function runAllScenarios(filterIds = null) {
  const targets = filterIds ? scenarios.filter(s => filterIds.includes(s.id)) : scenarios;
  const results = [];
  for (const scenario of targets) {
    console.log(`\n▶ Running scenario: ${scenario.name} (${scenario.id})`);
    const trace = await runScenario(scenario, { baseUrl: BASE_URL, screenshotRoot: SCREENSHOT_ROOT });
    const executed = trace.steps.filter(s => s.status === 'EXECUTED').length;
    const failed = trace.steps.filter(s => s.status === 'FAILED').length;
    console.log(`  ${executed} steps executed, ${failed} steps FAILED for real${trace.aborted ? ' — scenario aborted early' : ''}`);
    results.push(trace);
  }
  return results;
}

if (process.argv[1].endsWith('simulate-order-flow.mjs')) {
  (async () => {
    console.log(`🔍 Target: ${BASE_URL}`);
    console.log(`📸 Screenshots will be saved under: ${SCREENSHOT_ROOT}\n`);
    const filterArg = process.argv[2]; // optional: node simulate-order-flow.mjs solo-craver,dine-in
    const filterIds = filterArg ? filterArg.split(',') : null;
    const results = await runAllScenarios(filterIds);

    const evidencePath = path.resolve(process.cwd(), `documentation/audits/${RUN_ID}/evidence.json`);
    fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
    fs.writeFileSync(evidencePath, JSON.stringify({ baseUrl: BASE_URL, runId: RUN_ID, results }, null, 2));

    console.log(`\n✅ Raw evidence written to: ${evidencePath}`);
    console.log(`⚠️  Nothing above is a UX verdict. Next step: open every screenshot`);
    console.log(`   and write the actual critique — see SKILL.md "Evidence Review" step.`);
  })();
}
