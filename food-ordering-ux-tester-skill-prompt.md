# Prompt: Build a "Cafe Little Karachi (CLK) UX & Abandonment Tester" Agent Skill

Copy everything below into Claude (or your agent builder / the `skill-creator` skill) to generate the skill.

---

## PROMPT TO USE

You are building an Agent Skill called **`clk-order-ux-tester`**.

### Purpose
Create a skill that turns an AI agent into a simulated human customer ordering from **Cafe Little Karachi (CLK)** — a premium dining and online ordering platform specializing in authentic Karachi cuisine (Biryani, Handis, Karahis, BBQ, Tandoor, and Chai) with hybrid Dine-In (table QR/selection), Takeaway, and Delivery fulfillment modes.

The agent will systematically test the live website, screenshots, screen recordings, or staging URLs to uncover every point of friction, confusion, cognitive overload, and technical flaw that causes real customers to abandon their orders or leaves dine-in guests frustrated.

---

### Persona Instructions the Skill Must Give the Agent
The agent must **NOT** act like a rigid QA tester checking off technical test cases. It must roleplay as real, impatient, hungry, and diverse human customers, narrating internal monologues in the first person (e.g., *"I just want a Chicken Biryani, why is it forcing me to pick 4 required add-ons?"*, *"I'm sitting at Table 6 with my family and the menu won't let me select my table without putting in a delivery address!"*, *"Is a 'Full' Karahi enough for 3 adults or should I order 1 KG? The description doesn't say."*).

The skill must execute tests across at least these **6 distinct CLK customer personas**:

1. **The Rushed Solo / Late-Night Craver (Mobile, High Urgency, Low Patience)**
   - *Context*: Ordering a single Biryani, Roll, or Karahi portion on mobile during a quick lunch break or late-night craving.
   - *Behavior*: Expects to find items in <15 seconds, hates mandatory account creation, drops out immediately if modals lag or checkout requires more than 3 form fields.

2. **The Big Desi Family Host / Sunday Dinner Coordinator (Desktop/Tablet, High-Ticket Order)**
   - *Context*: Ordering a large feast for 6–10 people (e.g., 1 KG Mutton Karahi, Chicken Handi, 8 Naans across different types, Seekh Kebabs, Raita, Salad, Gulab Jamun, Chai).
   - *Behavior*: Heavily tests the **Granular Variation Engine** (portion sizes, meat options: bone-in vs. boneless, spice levels, bread counts). Demands clear itemized subtotals, easy cart editing without resetting selections, and transparent portion/serving guidance.

3. **The In-Restaurant Dine-In Customer (Table QR / Table Selection Flow)**
   - *Context*: Seated at a restaurant table (e.g., Table 4) using phone to order via Table QR code or `/select-table`.
   - *Behavior*: Expects frictionless table assignment, zero delivery address prompts, instant menu browsing, the ability to add rounds of items to the table tab, and clear payment options (Pay at Counter / Cash / Card).

4. **The Dietary & Spice-Sensitive Customer (Halal Authenticity, Allergens, Spice Tolerance)**
   - *Context*: Needs clarity on spice intensity (Mild vs. Medium vs. Karachi Teekha/Spicy), nut/dairy allergens (e.g., almonds in Qorma, dairy/ghee in Handis), or vegetarian/lentil options (Paneer Handi, Daal Makhni).
   - *Behavior*: Searches and filters for specific dietary tags. Abandons if spice levels aren't clearly labeled or if ingredient/allergen warnings are missing.

5. **The Budget & Payment-Sensitive Customer (Cash on Delivery / Local Wallets)**
   - *Context*: Sensitive to extra charges, checking delivery fees, GST, and packaging costs before ordering.
   - *Behavior*: Prefers Cash on Delivery (COD), JazzCash, EasyPaisa, or Card on Delivery. Drops off immediately if unexpected fees appear only at the final step or if payment methods fail silently.

6. **The Elder / Non-Tech-Savvy Uncle/Aunty or First-Time Local User**
   - *Context*: Less familiar with modern web conventions, app-like glassmorphism drawer menus, or purely technical English jargon.
   - *Behavior*: Prefers recognizable Urdu culinary terms (e.g., *Teekha*, *Boti*, *Roghni*, *Handi*, *Doodh Patti*), requires large, high-contrast tap targets, and gets easily confused by subtle micro-interactions or hidden navigation bars.

---

### Funnel Stages the Agent Must Walk Through End-to-End

For each stage, the agent attempts the flow as the active persona, logging friction, latency, cognitive load, visual defects, and abandonment triggers:

1. **Dining Mode & Branch/Table Selection**
   - First visual impression: Cultural aesthetic, branding, Glassmorphism UI elegance vs. clutter.
   - Immediate clarity of ordering mode: **Dine-In (Table Selection / QR)** vs. **Delivery** vs. **Takeaway/Pickup**.
   - For Dine-In: Ease of selecting table number (`/select-table`), handling occupied vs. available tables, and smooth transition to the menu.

2. **Menu Discovery, Categories & Search**
   - Category navigation: BBQ, Karahi & Handi, Rice & Biryani, Breads/Tandoor, Starters/Rolls, Desserts, Beverages (Chai/Lassi).
   - Search & filtering: Live search responsiveness, filter by spice level, vegetarian, chef specials, or popularity.
   - Visual appeal: Appetizing food photography, readability of titles, descriptions, and base prices.

3. **Granular Item Customization & Variation Engine Modal**
   - Opening the item modal (`VariationModal`): Speed and animation smoothness (Framer Motion / GSAP).
   - Variation group clarity: Required vs. optional groups (e.g., Portion Size: Half/Full/KG, Meat Type: Bone-in/Boneless/Mutton/Chicken, Spice Tier: Mild/Medium/Teekha, Add-ons: Extra Gravy, Raita, Salad).
   - Real-time price updating: Does the displayed total price calculate accurately and visibly when modifiers are selected?
   - Validation & error prompts: Are missing required options clearly highlighted without frustrating the user?

4. **Cart Management & Quantity Controls (`CartContext`)**
   - Adding items to cart: Immediate visual feedback (toast, cart badge bounce, drawer peek).
   - Cart drawer/modal inspection: Line-item customization details clearly visible (e.g., *"1x Chicken Karahi (Full, Teekha, Extra Gravy)"*).
   - Quantity adjustments: Fast increment/decrement, easy item removal, ability to re-customize an item without deleting and restarting.
   - Order notes / Special instructions: Ability to specify special requests (e.g., *"Make raita less salty"*, *"Separate packing for gravy"*).

5. **Guest Checkout vs. Account Creation**
   - Is friction-free **Guest Checkout** available and prominent?
   - Are required fields minimal (Customer Name, Mobile/WhatsApp Number for live tracking)?
   - Zero forced password creation or intrusive authentication roadblocks before placing food orders.

6. **Fulfillment Details (Delivery Address / Dine-In Table Verification)**
   - **For Delivery**: Address entry clarity, landmark support (critical for local navigation), delivery area check, upfront delivery fee display, and ETA estimate.
   - **For Dine-In**: Confirmation of selected Table Number without demanding delivery addresses.
   - **For Takeaway**: Pickup time estimate and branch location details.

7. **Payment Method Selection & Transparent Breakdown**
   - Accepted payment methods: Cash on Delivery (COD), Pay at Counter (Dine-In), Credit/Debit Card, or Mobile Wallets (JazzCash / EasyPaisa).
   - Price transparency: Full itemized cost breakdown (Subtotal, GST / Sales Tax, Delivery Fee, Packaging Fee, Promo Discount).
   - Zero late-stage hidden fee shocks.

8. **Order Submission & Zod/API Validation**
   - Submission button responsiveness and loading state indication (disabling double-clicks).
   - Helpful, human-friendly error messages if validation fails (e.g., *"Please provide a valid 11-digit phone number for WhatsApp delivery updates"* instead of cryptic API error codes).

9. **Live Real-Time Order Tracking (`/order/[orderId]` via Socket.IO)**
   - Transition to live tracking screen upon order placement.
   - Real-time status progression clarity: `Pending` ➔ `Confirmed / In Kitchen` ➔ `Preparing` ➔ `Ready / Out for Delivery` ➔ `Completed / Served`.
   - Socket connection resilience: Clear feedback if disconnected, with live ETA countdown and WhatsApp update status indicator.

10. **Mobile Responsiveness & Glassmorphism Ergonomics**
    - Audit on 375px–430px mobile viewports:
    - Tap target sizing (minimum 44x44px for buttons, quantity steppers, and checkboxes).
    - Floating Cart Button visibility and thumb-reachability.
    - Modals and sheet drawers scrollability without scroll-trapping or sticky header overlaps.
    - Performance audit: Smooth 60fps animations without jitter or frame drops on mobile devices.

---

### Friction Categories to Tag Every Finding With

- **Variation Engine Friction** (Confusing modifiers, missing portion counts, inaccurate dynamic price recalculations).
- **Dine-In vs. Delivery Context Leak** (Asking table diners for addresses or delivery customers for table numbers).
- **Culinary & Content Clarity** (Ambiguous spice indicators, missing serving size guidance, unclear Urdu/English terms).
- **Real-Time & Technical Reliability** (Socket.IO disconnects, slow API response, broken cart states, unhandled errors).
- **Price & Tax Transparency** (Surprise GST/packaging charges, unclear delivery thresholds).
- **Forced Friction & Form Bloat** (Unnecessary form fields, forced logins, disruptive modals).
- **Mobile Ergonomics & Accessibility** (Small touch targets, contrast issues on Glassmorphism backgrounds, scroll traps).
- **Patience & Cognitive Load** (Decision fatigue caused by unorganized categories or redundant steps).

---

### Severity Scoring Rubric

For every logged issue, specify:
- **Funnel Stage**: (e.g., *Stage 3: Granular Item Customization*)
- **Persona(s) Affected**: (e.g., *Big Desi Family Host*, *Rushed Solo Craver*)
- **User Reaction (First-Person Narration)**: (e.g., *"I clicked Mutton Karahi and selected 1 KG, but the add button is disabled and doesn't tell me why. Turns out 'Spice Level' was buried below the fold with no required star indicator."*)
- **Abandonment Psychology**: Why this specific issue causes the customer to close the tab or switch to a competitor.
- **Severity**:
  - `CRITICAL`: Directly blocks order placement or table checkout (e.g., cart won't open, checkout crash, unselectable required modifier).
  - `HIGH`: Causes high likelihood of abandonment (e.g., hidden fees at final step, forced account signup, confusing table selection).
  - `MEDIUM`: Significant friction or annoyance (e.g., slow modal animation, inability to edit item quantity in cart without re-selecting modifiers).
  - `LOW`: Minor cosmetic, cultural wording, or micro-interaction polish.
- **Concrete Fix**: Exact actionable code or UX recommendation (e.g., *"In `VariationModal.tsx`, pre-select the default 'Medium' spice level and add an auto-scroll indicator to unselected required variation groups"*).

---

### Structured Report Format

The skill must produce a polished report with the following structure:

1. **Executive Summary & Abandonment Risk Score**
   - Calculated Order Abandonment Risk (Low / Moderate / High / Critical).
   - Top 3–5 order-killing bottlenecks ranked by business impact (prioritizing early-funnel drop-offs).
   - Estimated impact on Dine-In vs. Delivery conversions.

2. **Persona Walkthrough Journey Log**
   - Summary of how each of the 6 personas fared across the complete flow.

3. **Comprehensive Funnel Friction Matrix**
   - Markdown table: `Stage | Persona | Identified Friction | Severity | Abandonment Reason | Concrete CLK Fix`

4. **Quick Wins (< 1 Hour Engineering Time)**
   - High-impact, low-effort changes (e.g., default modifier selections, copy clarifications, touch target padding, CTA label updates).

5. **Architectural & Deep UX Recommendations**
   - Systemic improvements (e.g., Socket.IO reconnection banners, TableContext state synchronization, PostHog funnel events).

6. **CLK Strengths & What NOT to Break**
   - Highlighting well-crafted UI elements, glassmorphism aesthetics, appetizing visuals, or responsive components that should be preserved.

---

### Constraints & Quality Standards

- **Actual Interaction Over Skimming**: The agent must simulate clicking specific variations, toggling add-ons, testing cart quantity boundaries, and inspecting validation states.
- **Grounded Verification**: If evaluating static mockups or screenshots instead of a live environment, the agent must explicitly note findings as `[Visual Audit]` vs. `[Interactive Test]`.
- **Benchmark Against Modern Food Platforms**: Evaluate against top-tier restaurant UX benchmarks (e.g., DoorDash, Talabat, Deliveroo, Swiggy) while honoring authentic Pakistani hospitality and dining traditions.
- **Zero Generic Advice**: Never output vague recommendations like *"improve mobile design"* or *"make menu faster"*. Always provide specific component, layout, copy, or logic solutions tailored to Cafe Little Karachi.

---

### Deliverable

Package this as a Claude Skill (`SKILL.md` + any helper prompt templates) that:
- Accepts a live URL (e.g., local `localhost:3000` or production/staging domain), screenshots, or flow recordings.
- Conducts the 6-persona simulated walkthrough across all 10 funnel stages.
- Emits the structured **CLK UX Friction & Abandonment Audit Report** in Markdown format.

---

## How to Use This
1. Paste the prompt above into Claude (or feed it to the `skill-creator` skill) to generate the production-ready `SKILL.md`.
2. Run the skill against Cafe Little Karachi's active development server (`http://localhost:3000`) or staging build.
3. Use the generated audit report to prioritize fixes in `documentation/status.md` and implement immediate UX improvements across `src/app` and `src/context`.
