# CLK Customer Personas — 10 Scenarios

Six of these existed before; four are new (marked NEW) to close real gaps the
old suite never touched: session persistence, promo-code failure states,
returning-customer expectations, and actual assistive-tech/low-end-device use.

---

## 1. The Rushed Solo / Late-Night Craver
Mobile, <90s patience budget, single item. Abandons on forced signup, laggy modals, deep scroll.

## 2. The Big Desi Family Host
Desktop, high-ticket multi-item order. Abandons on unclear portion sizing, cart line-items that hide modifiers, no way to edit a modifier without deleting the item.

## 3. The In-Restaurant Dine-In Customer
Mobile via QR/table-select. Abandons (or gets confused) if asked for a delivery address while seated at a table.

## 4. The Dietary & Spice-Sensitive Customer
Needs spice/allergen clarity before ordering. Abandons on missing badges/ingredient info.

## 5. The Budget & Cash-on-Delivery Customer
Price-sensitive. Abandons on late-appearing fees, broken promo codes, missing COD/wallet options.

## 6. The Non-Tech-Savvy Elder
Low digital literacy, larger system font. Abandons on tiny tap targets, low contrast, jargon over familiar culinary terms.

## 7. NEW — The Distracted / Interrupted Orderer
- **Context**: Gets a call or notification mid-checkout, backgrounds the tab/app, comes back 5+ minutes later.
- **Pain points**: Cart wiped on return, session/table context lost, forced to restart from the menu.
- **Evaluation metric**: Does cart state and table/delivery context survive a real backgrounding + reload?

## 8. NEW — The Deal-Hunter / Promo Code Seeker
- **Context**: Actively looks for a discount before ordering; will try a code even without evidence one exists.
- **Pain points**: Promo field accepts input but gives no feedback, or a vague "invalid code" with no reason (expired vs. wrong vs. minimum-order-not-met).
- **Evaluation metric**: Does a failed promo code explain *why* it failed?

## 9. NEW — The Returning Customer Expecting Saved Info
- **Context**: Has ordered before. Expects the app to remember them.
- **Pain points**: Forced to re-enter address/phone from scratch, no "reorder last order" option, no recognition of returning status at all.
- **Evaluation metric**: Are saved address, payment method, and past-order reorder actually surfaced after login?

## 10. NEW — Accessibility & Low-End Device User
- **Context**: Keyboard-only navigation, screen-reader landmarks, throttled 3G connection, older/low-spec phone.
- **Pain points**: No visible focus states, missing ARIA roles/labels, page unusable or timing out on slow connections, animations that stutter and block interaction on weak hardware.
- **Evaluation metric**: Can the entire order be placed using Tab/Enter alone, with visible focus at every step, and does the page still load/respond under 3G throttling within a reasonable time?
