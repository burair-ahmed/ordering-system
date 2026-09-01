#!/usr/bin/env node
/**
 * check-mobile-ergonomics.mjs
 *
 * PRIMARY: runtime check against the real rendered page — actual computed
 * bounding boxes and actual computed contrast ratios, not regex guesses.
 * SECONDARY: static source scan, kept only as a cheap early-warning signal.
 * The static scan's output must never be reported as a finding on its own —
 * it just tells you where to look at runtime.
 */

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const SRC_DIR = path.resolve(process.cwd(), 'cafe-little-karachi/src');

// ---------- RUNTIME (real) ----------
export async function runRuntimeErgonomicsCheck(baseUrl, routes = ['/']) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const findings = [];

  for (const route of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'load' });

    const pageFindings = await page.evaluate(() => {
      function luminance(r, g, b) {
        const a = [r, g, b].map(v => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
      }
      function contrastRatio(fg, bg) {
        const l1 = luminance(...fg) + 0.05;
        const l2 = luminance(...bg) + 0.05;
        return l1 > l2 ? l1 / l2 : l2 / l1;
      }
      function parseRGB(str) {
        const m = str.match(/\d+/g);
        return m ? m.slice(0, 3).map(Number) : [255, 255, 255];
      }

      const results = [];
      const clickable = document.querySelectorAll('button, a, [role="button"], input, select, textarea');
      clickable.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return; // not rendered/visible
        if (rect.width < 44 || rect.height < 44) {
          results.push({
            type: 'TOUCH_TARGET',
            selector: el.getAttribute('data-testid') || el.tagName + (el.className ? '.' + String(el.className).split(' ')[0] : ''),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
        const style = getComputedStyle(el);
        const fg = parseRGB(style.color);
        let bgEl = el;
        let bg = parseRGB(style.backgroundColor);
        // walk up if transparent
        while ((style.backgroundColor === 'rgba(0, 0, 0, 0)' || style.backgroundColor === 'transparent') && bgEl.parentElement) {
          bgEl = bgEl.parentElement;
          bg = parseRGB(getComputedStyle(bgEl).backgroundColor);
        }
        const ratio = contrastRatio(fg, bg);
        if (ratio < 4.5 && el.textContent.trim().length > 0) {
          results.push({
            type: 'LOW_CONTRAST',
            selector: el.getAttribute('data-testid') || el.tagName,
            text: el.textContent.trim().slice(0, 40),
            ratio: Math.round(ratio * 100) / 100,
          });
        }
      });
      return results;
    });

    pageFindings.forEach(f => findings.push({ ...f, route }));
  }

  await browser.close();
  return { totalFindings: findings.length, findings };
}

// ---------- STATIC (secondary signal only) ----------
function getAllFiles(dir, exts = ['.tsx', '.jsx', '.css', '.ts']) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.some(ext => file.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

export function runStaticScan() {
  const files = getAllFiles(SRC_DIR);
  const hints = [];
  for (const filePath of files) {
    const relPath = path.relative(process.cwd(), filePath);
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('<img ')) {
        hints.push({ file: relPath, line: idx + 1, hint: 'raw <img> tag — check if this causes slow/unoptimized image loads at runtime' });
      }
    });
  }
  return { totalFilesScanned: files.length, hints };
}

if (process.argv[1].endsWith('check-mobile-ergonomics.mjs')) {
  (async () => {
    const baseUrl = process.env.CLK_BASE_URL || 'http://localhost:3000';
    console.log(`📱 Runtime ergonomics check against ${baseUrl}...`);
    const runtime = await runRuntimeErgonomicsCheck(baseUrl, ['/']);
    console.log(`Real findings from rendered DOM: ${runtime.totalFindings}`);
    console.log(JSON.stringify(runtime.findings, null, 2));

    console.log(`\n📄 Static scan (secondary signal only)...`);
    const staticResult = runStaticScan();
    console.log(`${staticResult.hints.length} hints across ${staticResult.totalFilesScanned} files — investigate at runtime, don't report these as findings directly.`);
  })();
}
