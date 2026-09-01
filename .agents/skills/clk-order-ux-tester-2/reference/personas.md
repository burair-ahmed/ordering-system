# CLK Customer Personas — Deep Dive Specification

When conducting audits on Cafe Little Karachi, use these 6 personas to evaluate how different customer types experience the product.

---

## 1. The Rushed Solo / Late-Night Craver
- **Demographics**: 20–32 y/o professional or student.
- **Device & Context**: Mobile (375px–390px viewport), often one-handed on mobile connection.
- **Intent**: Fast single-item order (Chicken Biryani, Beef Bihari Roll, or Karahi portion).
- **Time Threshold**: Wants checkout completed in <90 seconds.
- **Pain Points**:
  - Unskippable multi-step registration or phone verification roadblocks.
  - Slow animated transitions or laggy variation modals.
  - Cluttered category headers that force extensive vertical scrolling.
- **Evaluation Metric**: Clicks-to-checkout, modal load latency, mandatory form field count.

---

## 2. The Big Desi Family Host / Sunday Dinner Coordinator
- **Demographics**: 35–55 y/o head of household hosting family or guests.
- **Device & Context**: Tablet or Desktop (1024px–1440px viewport).
- **Intent**: High-ticket ($50–$150+ / Rs. 5,000–15,000+) multi-course meal for 6–10 people.
- **Typical Basket**: 1 KG Mutton Karahi, Chicken Makhni Handi, 8 Naans (Roghni/Garlic/Plain), Seekh Kebabs, Raita, Salad, Gulab Jamun, Chai.
- **Pain Points**:
  - Confusing portion sizing (e.g. not knowing if 'Full' vs '1 KG' serves 3 or 5 people).
  - Cumbersome bread/naan ordering (having to add items one-by-one).
  - Inability to edit item modifiers directly in the cart without deleting and starting over.
  - Cart line-items that omit the selected modifiers (e.g. showing "Karahi" instead of "Mutton Karahi 1KG, Teekha, Boneless").
- **Evaluation Metric**: Variation clarity, modifier transparency in cart, ease of bulk modifications.

---

## 3. The In-Restaurant Dine-In Customer
- **Demographics**: Any age, seated physically inside Cafe Little Karachi.
- **Device & Context**: Mobile via QR code scan or `/select-table`.
- **Intent**: Order food directly to Table #4, request kitchen rounds, pay via counter or digital card.
- **Pain Points**:
  - Context Leaks: UI asking for a street delivery address, delivery fee, or courier instructions when seated at a table.
  - Confusion over whether order was sent to the kitchen vs awaiting bill payment.
  - Difficulty selecting or verifying table number.
- **Evaluation Metric**: Table context persistence (`TableContext`), zero delivery field leaks, order status transparency.

---

## 4. The Dietary & Spice-Sensitive Customer
- **Demographics**: Parents with young children, tourists, spice-sensitive eaters, or strict vegetarians.
- **Device & Context**: Mobile or Desktop.
- **Intent**: Order safely without risking extreme chili heat, nut allergies (almond paste in Qorma/Mughlai dishes), or dairy/ghee intolerance.
- **Pain Points**:
  - Missing or ambiguous spice indicators (no Mild/Medium/Teekha badges).
  - Lack of allergen warnings (dairy/nuts/gluten).
  - Missing dedicated Vegetarian / Daal / Paneer category filters.
- **Evaluation Metric**: Presence of dietary badges, ingredient transparency, spice level modifier presence.

---

## 5. The Budget & Cash-on-Delivery (COD) Customer
- **Demographics**: Budget-conscious diners, students, or cash-preferred users.
- **Device & Context**: Mobile.
- **Intent**: Ensure total cost matches budget before placing the order.
- **Pain Points**:
  - Surprise late-stage fees (hidden packaging charges, unexpected sales tax, arbitrary delivery fees).
  - Missing Cash on Delivery (COD) or local digital wallet (JazzCash, EasyPaisa) options.
  - Confusing coupon/discount error states with no clear reason why a code failed.
- **Evaluation Metric**: Upfront price breakdown, fee transparency, payment method reliability.

---

## 6. The Non-Tech-Savvy Elder / First-Time Local User
- **Demographics**: 50+ y/o family members or users with low digital literacy.
- **Device & Context**: Low-to-mid range mobile device, often with large system font sizing.
- **Intent**: Order dinner using familiar culinary terminology without getting lost in complex UI hierarchies.
- **Pain Points**:
  - Small touch targets (<44x44px) that lead to mis-taps.
  - Low-contrast text on glassmorphic / translucent backgrounds.
  - Overly technical English jargon rather than authentic culinary terms (*Teekha*, *Boti*, *Roghni*, *Handi*, *Doodh Patti*).
  - Hidden swipe gestures or non-obvious hamburger drawers.
- **Evaluation Metric**: WCAG AAA/AA contrast compliance, touch target sizing, microcopy readability.
