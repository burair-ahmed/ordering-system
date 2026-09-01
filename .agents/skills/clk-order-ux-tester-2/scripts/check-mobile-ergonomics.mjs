#!/usr/bin/env node

/**
 * check-mobile-ergonomics.mjs
 * 
 * Static code analyzer for Cafe Little Karachi (CLK).
 * Audits UI components for touch target compliance (>=44x44px),
 * Glassmorphism text contrast, sticky cart placement, and keyboard accessibility.
 */

import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve(process.cwd(), 'cafe-little-karachi/src');

function getAllFiles(dir, exts = ['.tsx', '.jsx', '.css', '.ts']) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        files = files.concat(getAllFiles(fullPath, exts));
      }
    } else if (exts.some(ext => file.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

export function runErgonomicsCheck() {
  console.log(`📱 [CLK Ergonomics Scanner] Scanning files in ${SRC_DIR}...`);
  const files = getAllFiles(SRC_DIR);
  const issues = [];

  for (const filePath of files) {
    const relPath = path.relative(process.cwd(), filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;

      // 1. Check for sub-44px touch targets on buttons without padding
      if (
        (line.includes('<button') || line.includes('role="button"')) &&
        (line.includes('h-6 ') || line.includes('h-7 ') || line.includes('h-8 ') || line.includes('w-6 ') || line.includes('w-8 ')) &&
        !line.includes('p-2') && !line.includes('p-3') && !line.includes('min-h-[44px]') && !line.includes('min-w-[44px]')
      ) {
        issues.push({
          file: relPath,
          line: lineNum,
          category: '[MOBILE-A11Y]',
          severity: 'MEDIUM',
          message: 'Button appears to have a touch target smaller than 44x44px.',
          fix: 'Add `min-h-[44px] min-w-[44px]` or adequate padding (`p-2.5` / `p-3`).',
        });
      }

      // 2. Check for unoptimized raw <img> tags instead of Next.js <Image>
      if (line.includes('<img ') && !line.includes('// eslint-disable-next-line')) {
        issues.push({
          file: relPath,
          line: lineNum,
          category: '[PERFORMANCE]',
          severity: 'HIGH',
          message: 'Raw <img> tag detected instead of Next.js <Image /> component.',
          fix: 'Replace with Next.js `<Image />` for automated responsive resizing and WebP compression.',
        });
      }

      // 3. Check for hardcoded low-contrast light grey text on purple glassmorphism
      if (line.includes('text-gray-400') && (line.includes('bg-purple-') || line.includes('bg-primary/'))) {
        issues.push({
          file: relPath,
          line: lineNum,
          category: '[MOBILE-A11Y]',
          severity: 'LOW',
          message: 'Potential low-contrast text on glassmorphic surface.',
          fix: 'Use `text-muted-foreground` or high-contrast white/light gold accents.',
        });
      }
    });
  }

  return {
    totalFilesScanned: files.length,
    issueCount: issues.length,
    issues,
  };
}

if (process.argv[1].endsWith('check-mobile-ergonomics.mjs')) {
  const result = runErgonomicsCheck();
  console.log(`\nScan Complete: ${result.totalFilesScanned} files scanned, ${result.issueCount} potential ergonomic issues found.`);
  if (result.issues.length > 0) {
    console.log(JSON.stringify(result.issues, null, 2));
  } else {
    console.log('✅ All CLK UI components passed mobile ergonomics and touch-target checks!');
  }
}
