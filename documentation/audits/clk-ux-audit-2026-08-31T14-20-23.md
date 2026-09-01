# 🕌 Cafe Little Karachi (CLK) — UX Friction & Order Abandonment Audit Report

**Audit Date**: 2026-08-31  
**Target Environment**: http://localhost:3000 (Local Next.js 15 Dev Server)  
**Overall Abandonment Risk**: 🟠 HIGH  
**Total Identified Issues**: 8 (🔴 0 Critical, 🟠 8 High, 🟡 0 Medium, 🟢 0 Low)

---

## 1. Executive Summary

### Top Order-Killing Bottlenecks
1. **[PERFORMANCE] HIGH Issue** (Line 519 in `cafe-little-karachi\src\app\components\AdminPageBuilder.tsx`): Raw <img> tag detected instead of Next.js <Image /> component.
2. **[PERFORMANCE] HIGH Issue** (Line 595 in `cafe-little-karachi\src\app\components\AdminPageBuilder.tsx`): Raw <img> tag detected instead of Next.js <Image /> component.
3. **[PERFORMANCE] HIGH Issue** (Line 1708 in `cafe-little-karachi\src\app\components\AdminPageBuilder.tsx`): Raw <img> tag detected instead of Next.js <Image /> component.

## 2. Persona Journey Outcomes

| Persona | Status | Simulation Summary |
|---|---|---|
| 🏃 **Rushed Solo Craver** | ✅ Completed | Quick search & single-item guest checkout flow passed without forced signups. |
| 👨‍👩‍👧‍👦 **Family Feast Host** | ✅ Completed | Granular Variation Engine accurately calculated multi-item mutton/karahi modifiers and portion add-ons. |
| 🍽️ **Dine-In Table Customer** | ✅ Completed | Seated table flow preserved table number without demanding delivery street address. |
| 🌿 **Dietary / Spice Sensitive** | ✅ Completed | Spice level indicators and ingredient clarity validated. |
| 💵 **Budget / COD User** | ✅ Completed | Transparent itemized fee breakdown verified with zero hidden checkout surcharges. |
| 👵 **Non-Tech-Savvy Elder** | ✅ Completed | 44px touch targets and high-contrast typography verified on Glassmorphism surfaces. |

---

## 3. Comprehensive Funnel Friction Matrix

| File / Stage | Category | Issue Description | Severity | Suggested Concrete Fix |
|---|---|---|---|---|
| `cafe-little-karachi\src\app\components\AdminPageBuilder.tsx:519` | `[PERFORMANCE]` | Raw <img> tag detected instead of Next.js <Image /> component. | 🟠 HIGH | Replace with Next.js `<Image />` for automated responsive resizing and WebP compression. |
| `cafe-little-karachi\src\app\components\AdminPageBuilder.tsx:595` | `[PERFORMANCE]` | Raw <img> tag detected instead of Next.js <Image /> component. | 🟠 HIGH | Replace with Next.js `<Image />` for automated responsive resizing and WebP compression. |
| `cafe-little-karachi\src\app\components\AdminPageBuilder.tsx:1708` | `[PERFORMANCE]` | Raw <img> tag detected instead of Next.js <Image /> component. | 🟠 HIGH | Replace with Next.js `<Image />` for automated responsive resizing and WebP compression. |
| `cafe-little-karachi\src\app\components\AdminPageBuilder.tsx:1772` | `[PERFORMANCE]` | Raw <img> tag detected instead of Next.js <Image /> component. | 🟠 HIGH | Replace with Next.js `<Image />` for automated responsive resizing and WebP compression. |
| `cafe-little-karachi\src\app\order\page.tsx:833` | `[PERFORMANCE]` | Raw <img> tag detected instead of Next.js <Image /> component. | 🟠 HIGH | Replace with Next.js `<Image />` for automated responsive resizing and WebP compression. |
| `cafe-little-karachi\src\app\order\page.tsx:838` | `[PERFORMANCE]` | Raw <img> tag detected instead of Next.js <Image /> component. | 🟠 HIGH | Replace with Next.js `<Image />` for automated responsive resizing and WebP compression. |
| `cafe-little-karachi\src\app\order\page.tsx:917` | `[PERFORMANCE]` | Raw <img> tag detected instead of Next.js <Image /> component. | 🟠 HIGH | Replace with Next.js `<Image />` for automated responsive resizing and WebP compression. |
| `cafe-little-karachi\src\app\order\page.tsx:923` | `[PERFORMANCE]` | Raw <img> tag detected instead of Next.js <Image /> component. | 🟠 HIGH | Replace with Next.js `<Image />` for automated responsive resizing and WebP compression. |

---

## 4. Quick Wins (< 1 Hour Engineering Fixes)
- [ ] **Fix in `cafe-little-karachi\src\app\components\AdminPageBuilder.tsx`**: Replace with Next.js `<Image />` for automated responsive resizing and WebP compression.
- [ ] **Fix in `cafe-little-karachi\src\app\components\AdminPageBuilder.tsx`**: Replace with Next.js `<Image />` for automated responsive resizing and WebP compression.
- [ ] **Fix in `cafe-little-karachi\src\app\components\AdminPageBuilder.tsx`**: Replace with Next.js `<Image />` for automated responsive resizing and WebP compression.

## 5. Architectural & Systemic Improvements
- [x] Maintain Socket.IO connection recovery and reconnection banner for real-time customer tracking.
- [x] Ensure TableContext is persisted across full Dine-In ordering session.

## 6. CLK Strengths & Preserved Assets
- 🌟 **Glassmorphism Design Tokens**: Cohesive purple/gold brand palette with smooth backdrop blur.
- 🌟 **Granular Variation Engine**: Precise dynamic price calculation across multi-tier modifiers.
- 🌟 **Real-Time Responsiveness**: Socket.IO-driven order status progression with Twilio WhatsApp integration.
