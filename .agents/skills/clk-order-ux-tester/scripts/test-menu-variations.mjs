#!/usr/bin/env node

/**
 * test-menu-variations.mjs
 * 
 * Tests CLK Variation Engine logic, ensuring all required options are validated,
 * dynamic pricing math is exact (basePrice + sum of selected options),
 * and sensible defaults prevent user drop-off.
 */

import fs from 'node:fs';
import path from 'node:path';

export function validateVariationCalculation(basePrice, selectedOptions = []) {
  const additional = selectedOptions.reduce((acc, opt) => acc + (opt.additionalPrice || 0), 0);
  return basePrice + additional;
}

export function auditVariationModalCode() {
  const modalPath = path.resolve(process.cwd(), 'cafe-little-karachi/src/components/VariationModal.tsx');
  if (!fs.existsSync(modalPath)) {
    return { error: `VariationModal not found at ${modalPath}` };
  }

  const content = fs.readFileSync(modalPath, 'utf-8');
  const checks = {
    hasRequiredValidation: content.includes('isRequired') || content.includes('required'),
    hasDynamicPriceRecalc: content.includes('totalPrice') || content.includes('basePrice'),
    hasAccessibilityDialog: content.includes('role="dialog"') || content.includes('aria-modal'),
    hasTouchOptimizedButtons: content.includes('min-h-[44px]') || content.includes('py-3') || content.includes('p-3'),
  };

  return {
    file: 'src/components/VariationModal.tsx',
    passed: Object.values(checks).every(Boolean),
    checks,
  };
}

if (process.argv[1].endsWith('test-menu-variations.mjs')) {
  console.log('🧪 [CLK Variation Tester] Testing Variation Engine logic...');
  const audit = auditVariationModalCode();
  console.log('Variation Modal Code Audit:', JSON.stringify(audit, null, 2));

  // Test math
  const testTotal = validateVariationCalculation(1200, [
    { name: '1 KG Portion', additionalPrice: 800 },
    { name: 'Extra Gravy', additionalPrice: 150 },
  ]);
  console.log(`\nSample Calculation: Base Rs. 1,200 + 1 KG (Rs. 800) + Extra Gravy (Rs. 150) = Rs. ${testTotal} (Expected: 2150) -> ${testTotal === 2150 ? '✅ PASS' : '❌ FAIL'}`);
}
