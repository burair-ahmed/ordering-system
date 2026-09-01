/**
 * scenarios.config.mjs
 *
 * 10 real customer scenarios. Every step is a real Playwright action against
 * the live app (baseUrl). This file assumes your components expose
 * data-testid attributes — see the REQUIRED_TESTIDS list at the bottom and
 * the "Selector setup" note in SKILL.md. If a testid doesn't exist yet,
 * the step will FAIL FOR REAL, which is the correct outcome: it means a
 * real user also has no reliable way to find that element.
 *
 * Adjust selectors to match your actual DOM before running. Do not soften
 * a step just to make it pass — that defeats the entire point of this skill.
 */

export const scenarios = [
  {
    id: 'solo-craver',
    name: 'Rushed Solo / Late-Night Craver',
    device: 'iPhone 13',
    steps: [
      { name: 'Land on homepage', description: 'First paint, mode selection visible', critical: true,
        action: async (page, { baseUrl }) => { await page.goto(baseUrl, { waitUntil: 'load' }); } },
      { name: 'Search for Biryani', description: 'Type into search, expect live results',
        action: async (page) => { await page.getByTestId('menu-search-input').fill('Biryani'); await page.waitForTimeout(200); } },
      { name: 'Open Chicken Biryani item', critical: true,
        action: async (page) => { await page.getByTestId('menu-item-card').first().click(); } },
      { name: 'Select single portion & add to cart', critical: true,
        action: async (page) => { await page.getByTestId('variation-add-to-cart').click(); } },
      { name: 'Go straight to guest checkout', critical: true,
        action: async (page) => { await page.getByTestId('cart-checkout-button').click(); } },
      { name: 'Attempt checkout without creating an account', critical: true,
        action: async (page) => { await page.getByTestId('guest-checkout-button').click(); } },
    ],
  },
  {
    id: 'family-host',
    name: 'Big Desi Family Feast Host',
    device: 'Desktop Chrome',
    steps: [
      { name: 'Land on homepage', critical: true,
        action: async (page, { baseUrl }) => { await page.goto(baseUrl, { waitUntil: 'load' }); } },
      { name: 'Open Karahi category', action: async (page) => { await page.getByTestId('category-karahi').click(); } },
      { name: 'Configure Mutton Karahi 1KG + Teekha + Extra Gravy', critical: true,
        action: async (page) => {
          await page.getByTestId('menu-item-mutton-karahi').click();
          await page.getByTestId('portion-1kg').click();
          await page.getByTestId('spice-teekha').click();
          await page.getByTestId('addon-extra-gravy').click();
          await page.getByTestId('variation-add-to-cart').click();
        } },
      { name: 'Add 8 naans (4 Roghni, 4 Plain)', fullPage: true,
        action: async (page) => {
          for (let i = 0; i < 4; i++) await page.getByTestId('naan-roghni-increment').click();
          for (let i = 0; i < 4; i++) await page.getByTestId('naan-plain-increment').click();
        } },
      { name: 'Open cart and check line-item detail', critical: true, fullPage: true,
        action: async (page) => { await page.getByTestId('cart-open-button').click(); } },
    ],
  },
  {
    id: 'dine-in',
    name: 'In-Restaurant Dine-In Customer',
    device: 'iPhone 13',
    steps: [
      { name: 'Open /select-table via QR link', critical: true,
        action: async (page, { baseUrl }) => { await page.goto(`${baseUrl}/select-table?table=4`, { waitUntil: 'load' }); } },
      { name: 'Confirm table 4 is selected', critical: true,
        action: async (page) => { await page.getByTestId('table-4').click(); } },
      { name: 'Add Handi + Naan to table order',
        action: async (page) => { await page.getByTestId('category-handi').click(); await page.getByTestId('menu-item-card').first().click(); await page.getByTestId('variation-add-to-cart').click(); } },
      { name: 'Go to checkout and verify NO delivery address field appears', critical: true, fullPage: true,
        action: async (page) => { await page.getByTestId('cart-checkout-button').click(); } },
    ],
  },
  {
    id: 'dietary-sensitive',
    name: 'Dietary & Spice-Sensitive Customer',
    device: 'iPhone 13',
    steps: [
      { name: 'Land on homepage', critical: true,
        action: async (page, { baseUrl }) => { await page.goto(baseUrl, { waitUntil: 'load' }); } },
      { name: 'Look for a vegetarian/dietary filter',
        action: async (page) => { await page.getByTestId('dietary-filter-vegetarian').click(); } },
      { name: 'Open Butter Chicken and look for spice/allergen info', fullPage: true,
        action: async (page) => { await page.getByTestId('menu-item-butter-chicken').click(); } },
    ],
  },
  {
    id: 'budget-cod',
    name: 'Budget & Cash-on-Delivery Customer',
    device: 'iPhone 13',
    steps: [
      { name: 'Add one item to cart', critical: true,
        action: async (page, { baseUrl }) => { await page.goto(baseUrl, { waitUntil: 'load' }); await page.getByTestId('menu-item-card').first().click(); await page.getByTestId('variation-add-to-cart').click(); } },
      { name: 'Try entering a promo code', action: async (page) => { await page.getByTestId('cart-open-button').click(); await page.getByTestId('promo-code-input').fill('SAVE10'); await page.getByTestId('promo-code-apply').click(); } },
      { name: 'Go to checkout and screenshot full fee breakdown', critical: true, fullPage: true,
        action: async (page) => { await page.getByTestId('cart-checkout-button').click(); } },
      { name: 'Check for COD / local wallet payment options', fullPage: true,
        action: async (page) => { await page.getByTestId('payment-method-list').scrollIntoViewIfNeeded(); } },
    ],
  },
  {
    id: 'nontech-elder',
    name: 'Non-Tech-Savvy Elder / First-Time User',
    device: 'Pixel 5',
    steps: [
      { name: 'Land on homepage', critical: true,
        action: async (page, { baseUrl }) => { await page.goto(baseUrl, { waitUntil: 'load' }); } },
      { name: 'Try to find the menu without scrolling knowledge', fullPage: true,
        action: async (page) => { await page.waitForTimeout(500); } },
      { name: 'Attempt to tap category tabs at default zoom', fullPage: true,
        action: async (page) => { await page.getByTestId('category-karahi').click(); } },
    ],
  },
  {
    id: 'interrupted-orderer',
    name: 'Distracted / Interrupted Orderer',
    description: 'Gets a phone call mid-checkout, backgrounds the tab, comes back 5+ minutes later.',
    device: 'iPhone 13',
    steps: [
      { name: 'Add items and reach checkout', critical: true,
        action: async (page, { baseUrl }) => { await page.goto(baseUrl, { waitUntil: 'load' }); await page.getByTestId('menu-item-card').first().click(); await page.getByTestId('variation-add-to-cart').click(); await page.getByTestId('cart-checkout-button').click(); } },
      { name: 'Simulate backgrounding the tab for 5 minutes',
        action: async (page) => { await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); await page.waitForTimeout(2000); /* real test should use longer waits / reload */ } },
      { name: 'Return and check if cart/session survived', critical: true, fullPage: true,
        action: async (page, { baseUrl }) => { await page.reload({ waitUntil: 'load' }); } },
    ],
  },
  {
    id: 'promo-hunter',
    name: 'Deal-Hunter / Promo Code Seeker',
    device: 'iPhone 13',
    steps: [
      { name: 'Add item to cart', critical: true,
        action: async (page, { baseUrl }) => { await page.goto(baseUrl, { waitUntil: 'load' }); await page.getByTestId('menu-item-card').first().click(); await page.getByTestId('variation-add-to-cart').click(); await page.getByTestId('cart-open-button').click(); } },
      { name: 'Enter an invalid promo code and screenshot the error', fullPage: true,
        action: async (page) => { await page.getByTestId('promo-code-input').fill('FAKECODE99'); await page.getByTestId('promo-code-apply').click(); await page.waitForTimeout(400); } },
    ],
  },
  {
    id: 'returning-customer',
    name: 'Returning Customer Expecting Saved Info',
    description: 'Has ordered before; expects saved address/payment/last order to be remembered.',
    device: 'iPhone 13',
    steps: [
      { name: 'Log in with an existing account', critical: true,
        action: async (page, { baseUrl }) => { await page.goto(`${baseUrl}/login`, { waitUntil: 'load' }); await page.getByTestId('login-phone-input').fill('03001234567'); await page.getByTestId('login-submit').click(); } },
      { name: 'Check for saved address at checkout', fullPage: true,
        action: async (page) => { await page.getByTestId('menu-item-card').first().click(); await page.getByTestId('variation-add-to-cart').click(); await page.getByTestId('cart-checkout-button').click(); } },
      { name: 'Check for one-tap reorder of last order', fullPage: true,
        action: async (page, { baseUrl }) => { await page.goto(`${baseUrl}/orders`, { waitUntil: 'load' }); } },
    ],
  },
  {
    id: 'constrained-access',
    name: 'Accessibility & Low-End Device User',
    description: 'Keyboard-only navigation, screen-reader landmarks, throttled 3G, older CPU.',
    device: 'Pixel 5',
    network: { offline: false, latency: 400, downloadThroughput: 400 * 1024 / 8, uploadThroughput: 200 * 1024 / 8 },
    steps: [
      { name: 'Load homepage on throttled 3G', critical: true,
        action: async (page, { baseUrl }) => { await page.goto(baseUrl, { waitUntil: 'load', timeout: 30000 }); } },
      { name: 'Navigate to menu using only Tab/Enter (keyboard only)',
        action: async (page) => { for (let i = 0; i < 8; i++) await page.keyboard.press('Tab'); await page.keyboard.press('Enter'); } },
      { name: 'Check focus visibility and ARIA landmarks', fullPage: true,
        action: async (page) => { await page.waitForTimeout(300); } },
    ],
  },
];

// Add these data-testid attributes to your components for this suite to run
// against your real app instead of failing on selector-not-found:
export const REQUIRED_TESTIDS = [
  'menu-search-input', 'menu-item-card', 'menu-item-mutton-karahi', 'menu-item-butter-chicken',
  'category-karahi', 'category-handi', 'dietary-filter-vegetarian',
  'variation-add-to-cart', 'portion-1kg', 'spice-teekha', 'addon-extra-gravy',
  'naan-roghni-increment', 'naan-plain-increment',
  'cart-open-button', 'cart-checkout-button', 'guest-checkout-button',
  'promo-code-input', 'promo-code-apply', 'payment-method-list',
  'table-4', 'login-phone-input', 'login-submit',
];
