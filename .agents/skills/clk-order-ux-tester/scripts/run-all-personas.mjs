#!/usr/bin/env node
/**
 * run-all-personas.mjs
 *
 * Master CLI for the clk-order-ux-tester skill (v2 — real evidence only).
 *
 * 1. Runs real ergonomics check against the live rendered page.
 * 2. Verifies variation pricing math (this part is legitimately deterministic,
 *    no roleplay needed).
 * 3. Runs all 10 real persona scenarios in a real browser, saving real
 *    screenshots and a real evidence.json.
 * 4. Generates a REPORT SKELETON — not a finished report. The agent running
 *    this skill must then open every screenshot and write the actual
 *    brutal, specific critique before the report is considered done.
 */

import { runRuntimeErgonomicsCheck, runStaticScan } from './check-mobile-ergonomics.mjs';
import { auditVariationModalCode, validateVariationCalculation } from './test-menu-variations.mjs';
import { runAllScenarios } from './simulate-order-flow.mjs';
import { generateSkeletonReport, saveReport } from './audit-report-generator.mjs';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.CLK_BASE_URL || 'http://localhost:3000';

async function main() {
  console.log(`=============================================================`);
  console.log(`Cafe Little Karachi — Real UX & Abandonment Test Suite (v2)`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`=============================================================\n`);

  console.log(`▶ [1/4] Runtime ergonomics check (real DOM, real contrast)...`);
  const ergo = await runRuntimeErgonomicsCheck(BASE_URL, ['/']);
  console.log(`  ${ergo.totalFindings} real findings.\n`);

  console.log(`▶ [2/4] Variation pricing math check...`);
  const varCheck = auditVariationModalCode();
  console.log(`  ${varCheck.error ? '⚠️ ' + varCheck.error : (varCheck.passed ? 'Static checks passed' : 'Static checks flagged issues — verify at runtime')}\n`);

  console.log(`▶ [3/4] Running all 10 persona scenarios in a real browser...`);
  const results = await runAllScenarios();
  const runId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  console.log(`\n▶ [4/4] Writing evidence + report skeleton...`);
  const evidence = { baseUrl: BASE_URL, runId, results, ergonomics: ergo };
  const evidencePath = path.resolve(process.cwd(), `documentation/audits/${runId}/evidence.json`);
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));

  const skeleton = generateSkeletonReport(evidence);
  const skeletonPath = saveReport(skeleton, runId);

  console.log(`\n=============================================================`);
  console.log(`RUN COMPLETE — but the audit is NOT finished.`);
  console.log(`Evidence: ${evidencePath}`);
  console.log(`Report skeleton: ${skeletonPath}`);
  console.log(`\nNEXT STEP (must be done by the agent, not a script):`);
  console.log(`Open every screenshot under documentation/audits/${runId}/screenshots/`);
  console.log(`and replace each "[replace this]" placeholder in the skeleton with a`);
  console.log(`real, specific, first-person, brutally honest reaction to what's on screen.`);
  console.log(`=============================================================\n`);
}

main().catch(err => {
  console.error('❌ Error executing test suite:', err);
  process.exit(1);
});
