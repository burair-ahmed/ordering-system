#!/usr/bin/env node

/**
 * run-all-personas.mjs
 * 
 * Master CLI tool for the clk-order-ux-tester skill.
 * Executes:
 * 1. Mobile ergonomics & touch target static analysis
 * 2. Menu variation logic & math verification
 * 3. Endpoint health and persona journey simulation
 * 4. Generates and saves the official CLK UX Audit Report
 */

import { runErgonomicsCheck } from './check-mobile-ergonomics.mjs';
import { auditVariationModalCode, validateVariationCalculation } from './test-menu-variations.mjs';
import { simulateHealthAndEndpoints, simulatePersonaFlows } from './simulate-order-flow.mjs';
import { generateAuditReport, saveAuditReport } from './audit-report-generator.mjs';

async function main() {
  console.log(`=============================================================`);
  console.log(`🕌 Cafe Little Karachi (CLK) — UX & Abandonment Test Suite`);
  console.log(`=============================================================\n`);

  // Step 1: Static Ergonomics Check
  console.log(`▶ [1/4] Running Mobile Ergonomics & A11y Static Check...`);
  const ergoResults = runErgonomicsCheck();
  console.log(`  Scanned ${ergoResults.totalFilesScanned} files -> ${ergoResults.issueCount} issues detected.\n`);

  // Step 2: Variation Engine Code Check
  console.log(`▶ [2/4] Verifying Granular Variation Engine...`);
  const varResults = auditVariationModalCode();
  console.log(`  VariationModal check: ${varResults.passed ? '✅ PASSED' : '⚠️ WARNINGS'}\n`);

  // Step 3: Endpoint & Persona Simulation
  console.log(`▶ [3/4] Running 6-Persona Journey Simulations...`);
  const healthResults = await simulateHealthAndEndpoints();
  const personaLogs = await simulatePersonaFlows();
  console.log(`  Simulated ${personaLogs.length} personas successfully.\n`);

  // Step 4: Generate Report
  console.log(`▶ [4/4] Generating Formal Audit Report...`);
  const allIssues = [...ergoResults.issues];
  const reportMarkdown = generateAuditReport({
    issues: allIssues,
    personas: personaLogs,
    health: healthResults,
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const reportFile = `clk-ux-audit-${timestamp}.md`;
  const savedPath = saveAuditReport(reportMarkdown, reportFile);
  saveAuditReport(reportMarkdown, 'clk-ux-audit-latest.md');

  console.log(`\n=============================================================`);
  console.log(`🎉 AUDIT COMPLETED!`);
  console.log(`📄 Report saved to: ${savedPath}`);
  console.log(`📄 Latest snapshot: documentation/audits/clk-ux-audit-latest.md`);
  console.log(`=============================================================\n`);

  console.log(reportMarkdown);
}

main().catch(err => {
  console.error('❌ Error executing CLK UX test suite:', err);
  process.exit(1);
});
