#!/usr/bin/env node
/**
 * audit-report-generator.mjs
 *
 * IMPORTANT: this generator does NOT decide whether the UX is good or bad.
 * It only assembles what actually happened (from evidence.json, produced by
 * simulate-order-flow.mjs) into a skeleton report with every screenshot
 * embedded and a "BRUTAL NARRATION — TO BE WRITTEN BY AGENT" placeholder
 * under each step.
 *
 * The calling agent (Claude) MUST then:
 *   1. Open every screenshot referenced below with the `view` tool.
 *   2. Replace each placeholder with a first-person, in-persona, specific
 *      reaction to what is actually visible — including calling out anything
 *      cheap, confusing, broken, or annoying. No hedging, no "looks good!"
 *      unless it genuinely is good.
 *   3. Only THEN assign a severity and abandonment verdict per step.
 *
 * If this file is used to auto-generate a "finished" report without that
 * step, the report is fabricated and worthless — same failure mode as the
 * old version of this skill.
 */

import fs from 'node:fs';
import path from 'node:path';

export function generateSkeletonReport(evidence) {
  const { baseUrl, runId, results } = evidence;
  const date = new Date().toISOString().split('T')[0];

  const totalSteps = results.reduce((acc, r) => acc + r.steps.length, 0);
  const failedSteps = results.reduce((acc, r) => acc + r.steps.filter(s => s.status === 'FAILED').length, 0);
  const abortedScenarios = results.filter(r => r.aborted).length;

  let report = `# Cafe Little Karachi — Real UX Audit (Run ${runId})\n\n`;
  report += `**Date**: ${date}  \n**Target**: ${baseUrl}  \n`;
  report += `**Scenarios run**: ${results.length}  \n`;
  report += `**Steps executed**: ${totalSteps}, of which **${failedSteps} FAILED FOR REAL** (element not found, action threw, or timeout)  \n`;
  report += `**Scenarios that aborted early on a critical failure**: ${abortedScenarios}\n\n`;
  report += `> ⚠️ This report is INCOMPLETE until every screenshot below has a real narration written in place of the placeholder. Severities and the executive summary should be written last, after all narrations exist — don't guess ahead of the evidence.\n\n`;
  report += `---\n\n`;

  report += `## Persona Run Outcomes\n\n`;
  report += `| Persona | Steps Executed | Steps Failed | Aborted Early | Abort Reason |\n`;
  report += `|---|---|---|---|---|\n`;
  for (const r of results) {
    const executed = r.steps.filter(s => s.status === 'EXECUTED').length;
    const failed = r.steps.filter(s => s.status === 'FAILED').length;
    report += `| ${r.scenarioName} | ${executed}/${r.steps.length} | ${failed} | ${r.aborted ? 'YES' : 'no'} | ${r.abortReason || '—'} |\n`;
  }
  report += `\n---\n\n`;

  report += `## Step-by-Step Evidence\n\n`;
  for (const r of results) {
    report += `### ${r.scenarioName}\n\n`;
    for (const step of r.steps) {
      report += `**${step.step}** — \`${step.status}\` (${step.timingMs}ms)\n\n`;
      if (step.error) report += `Real error: \`${step.error}\`\n\n`;
      if (step.screenshot) {
        report += `Screenshot: \`${step.screenshot}\`\n\n`;
      } else {
        report += `_No screenshot captured — page likely crashed before render._\n\n`;
      }
      report += `> **Brutal narration (TO BE WRITTEN BY AGENT AFTER VIEWING SCREENSHOT):** _[replace this]_\n\n`;
      report += `> **Severity (TO BE ASSIGNED AFTER NARRATION):** _[Critical / High / Medium / Low / Not an issue]_\n\n`;
    }
    report += `---\n\n`;
  }

  report += `## Executive Summary\n\n_[Write this LAST, after every narration above is real. Rank the top 3-5 abandonment-causing issues found, citing the specific screenshot for each.]_\n\n`;
  report += `## Quick Wins\n\n_[Fill in after narrations are complete.]_\n\n`;
  report += `## What's Actually Working\n\n_[Only include things you genuinely saw work cleanly in a screenshot — don't pad this section.]_\n`;

  return report;
}

export function saveReport(markdown, runId) {
  const outPath = path.resolve(process.cwd(), `documentation/audits/${runId}/report-skeleton.md`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, markdown, 'utf-8');
  return outPath;
}

if (process.argv[1].endsWith('audit-report-generator.mjs')) {
  const evidencePathArg = process.argv[2];
  if (!evidencePathArg) {
    console.error('Usage: node audit-report-generator.mjs <path-to-evidence.json>');
    process.exit(1);
  }
  const evidence = JSON.parse(fs.readFileSync(evidencePathArg, 'utf-8'));
  const markdown = generateSkeletonReport(evidence);
  const savedPath = saveReport(markdown, evidence.runId);
  console.log(`Skeleton report (with placeholders) saved to: ${savedPath}`);
  console.log(`Now: view every screenshot listed inside it and replace the placeholders.`);
}
