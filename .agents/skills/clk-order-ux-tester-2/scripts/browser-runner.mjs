/**
 * browser-runner.mjs
 *
 * Thin wrapper around Playwright that makes it impossible to fake a result.
 * Every step either succeeds against a real page (and gets a real screenshot
 * + real timing), or it throws and gets logged as a real failure.
 *
 * Nothing in this file is allowed to hardcode "pass".
 */

import { chromium, devices } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

export async function runScenario(scenario, { baseUrl, screenshotRoot }) {
  const outDir = path.join(screenshotRoot, scenario.id);
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const contextOptions = scenario.device ? { ...devices[scenario.device] } : {};
  if (scenario.network) {
    // Playwright doesn't throttle at context level directly; approximate via CDP below.
  }
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  // Optional network throttling (CDP) for the low-end/poor-network persona.
  if (scenario.network) {
    const client = await context.newCDPSession(page);
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', scenario.network);
  }

  const trace = {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    startedAt: new Date().toISOString(),
    steps: [],
    aborted: false,
    abortReason: null,
  };

  for (const [index, step] of scenario.steps.entries()) {
    const stepNum = String(index + 1).padStart(2, '0');
    const screenshotPath = path.join(outDir, `${stepNum}-${slug(step.name)}.png`);
    const stepLog = {
      step: step.name,
      description: step.description,
      screenshot: null,
      status: 'NOT_RUN',
      error: null,
      timingMs: null,
    };

    const startedAt = Date.now();
    try {
      await step.action(page, { baseUrl });
      // let animations/network settle briefly so the screenshot reflects real state
      await page.waitForTimeout(step.settleMs ?? 300);
      await page.screenshot({ path: screenshotPath, fullPage: !!step.fullPage });
      stepLog.status = 'EXECUTED'; // NOT "pass" — execution succeeded, judgment happens later from the screenshot
      stepLog.screenshot = screenshotPath;
    } catch (err) {
      // Real failure. Still try to capture whatever is on screen for evidence.
      try {
        await page.screenshot({ path: screenshotPath, fullPage: true });
        stepLog.screenshot = screenshotPath;
      } catch {
        /* page may be unusable; no screenshot possible */
      }
      stepLog.status = 'FAILED';
      stepLog.error = err.message;
    }
    stepLog.timingMs = Date.now() - startedAt;
    trace.steps.push(stepLog);

    if (stepLog.status === 'FAILED' && step.critical) {
      trace.aborted = true;
      trace.abortReason = `Critical step "${step.name}" failed: ${stepLog.error}`;
      break;
    }
  }

  trace.finishedAt = new Date().toISOString();
  await browser.close();
  return trace;
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
