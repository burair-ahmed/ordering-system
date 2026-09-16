# Social Media Links Update & Dummy Link Cleanup

**Date:** 2026-09-16  
**Scope:** Cafe Little Karachi (CLK)  
**File Modified:** `src/app/components/Footer.tsx`  

---

## Overview
Updated the customer-facing footer social icons with official Cafe Little Karachi / Little Karachi Express social links and eliminated dead `#` placeholder links.

## Changes
1. **Official Profiles**:
   - **Facebook**: `https://www.facebook.com/littlekarachiexpress`
   - **Instagram**: `https://www.instagram.com/littlekarachiexpress`
2. **Removed Placeholders**:
   - Removed Twitter and LinkedIn social buttons with `#` dummy targets.
   - Cleaned up unused icon imports (`FaTwitter`, `FaLinkedin`).
3. **Security & Accessibility**:
   - Added `target="_blank"` and `rel="noopener noreferrer"` for external tabs.
   - Added explicit `aria-label` attributes for screen readers.
4. **Analytics Tracking**:
   - Wired `trackEvent('journey_contact', { channel: item.label.toLowerCase(), destination: item.href, source: 'footer' })` to trigger the standard `Contact` Meta Pixel event and log Clarity interactions.
