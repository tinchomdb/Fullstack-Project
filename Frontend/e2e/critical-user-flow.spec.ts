import { test, expect, Page, Locator } from '@playwright/test';

const STRIPE_CARD = {
  number: process.env['STRIPE_TEST_CARD_NUMBER'] || '4242424242424242',
  expiry: process.env['STRIPE_TEST_CARD_EXPIRY'] || '12/26',
  cvc: process.env['STRIPE_TEST_CARD_CVC'] || '111',
} as const;

const DEBUG_BREAKPOINTS = process.env.DEBUG_BREAKPOINTS === 'true';

/**
 * Pause execution for debugging (only when DEBUG_BREAKPOINTS=true)
 */
async function pause(page: Page, step: string): Promise<void> {
  if (DEBUG_BREAKPOINTS) {
    console.log(`\n🔍 BREAKPOINT: ${step}`);
    console.log('   Inspect the page in the Inspector panel. Press Resume or F8 to continue.\n');
    await page.pause();
  }
}

/**
 * Clear cart if it has items
 */
async function clearCart(page: Page): Promise<void> {
  await page.goto('/cart');

  // Ensure we didn't get redirected to login (auth state should be loaded)
  await expect(page).toHaveURL(/\/cart/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');

  const clearBtn = page.locator('[data-testid="secondary-cta-btn"]').first();
  const isClearVisible = await clearBtn.isVisible({ timeout: 2000 }).catch(() => false);

  if (isClearVisible) {
    await clearBtn.click({ force: true });
    await expect(page).toHaveURL('/cart');
    // Wait for cart badge to disappear (cart is empty)
    await expect(page.locator('[data-testid="cart-badge"]')).toBeHidden({ timeout: 5000 });
  }
}

/**
 * Add a product to cart by its card element
 */
async function addProductToCart(page: Page, productCard: Locator): Promise<void> {
  const addBtn = productCard.locator('[data-testid="add-to-cart"]').first();
  await addBtn.click();
}

/**
 * Fill shipping information form
 */
async function fillShippingForm(page: Page): Promise<void> {
  const fields = [
    { testId: 'input-firstName', value: 'Tincho' },
    { testId: 'input-lastName', value: 'Barroso' },
    { testId: 'input-email', value: '***REMOVED***' },
    { testId: 'input-phone', value: '+12025551234' },
    { testId: 'input-address', value: '123 Test Street' },
    { testId: 'input-city', value: 'Test City' },
    { testId: 'input-state', value: 'CA' },
    { testId: 'input-zipCode', value: '12345' },
  ];

  for (const field of fields) {
    const input = page.locator(`[data-testid="${field.testId}"]`);
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await input.fill(field.value);
    }
  }

  // Handle country dropdown separately
  const countrySelect = page.locator('[data-testid="input-country"]');
  if (await countrySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    const options = await countrySelect.locator('option').all();
    if (options.length > 1) {
      await countrySelect.selectOption({ index: 1 });
    }
  }
}

/**
 * Fill Stripe payment form inside iframe
 */
async function fillStripePaymentForm(
  page: Page,
  cardDetails: { number: string; expiry: string; cvc: string },
): Promise<void> {
  // First, wait for the payment-element container in your Angular app
  await page.locator('#payment-element').waitFor({ state: 'visible', timeout: 10000 });
  console.log('✓ Payment Element container found');

  // Wait for Stripe to inject its iframe into the payment-element
  await page.waitForFunction(
    () => {
      const paymentElement = document.querySelector('#payment-element');
      if (!paymentElement) return false;

      const iframe = paymentElement.querySelector('iframe');
      return (
        iframe &&
        iframe.name.includes('__privateStripeFrame') &&
        iframe.src.includes('elements-inner-payment')
      );
    },
    { timeout: 15000 },
  );

  console.log('✓ Stripe Payment Element iframe detected');

  // Small delay to let Stripe fully render inside the iframe
  await page.waitForTimeout(1000);

  // Find the frame with the card accordion
  let stripeFrame: any = null;
  const frames = page.frames();

  for (const frame of frames) {
    try {
      const cardAccordion = frame.locator('[data-value="card"]').first();
      await cardAccordion.waitFor({ state: 'visible', timeout: 5000 });
      stripeFrame = frame;
      console.log('✓ Found card accordion in Stripe iframe');
      await cardAccordion.click();
      break;
    } catch (error) {
      continue;
    }
  }

  if (!stripeFrame) {
    const frameUrls = page.frames().map((f) => f.url());
    console.error('Available frames:', frameUrls);
    throw new Error('Could not find card accordion in Stripe Payment Element');
  } // Wait for card input fields
  await stripeFrame
    .locator('input[name="number"]')
    .first()
    .waitFor({ state: 'visible', timeout: 3000 });

  // Fill card details
  await stripeFrame.locator('input[name="number"]').first().fill(cardDetails.number);

  const expiryInput = stripeFrame.locator('input[name="expiry"]').first();
  if (await expiryInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await expiryInput.fill(cardDetails.expiry);
  }

  const cvcInput = stripeFrame.locator('input[name="cvc"]').first();
  if (await cvcInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await cvcInput.fill(cardDetails.cvc);
  }
}

test.describe('Critical User Flow - Full Purchase Journey', () => {
  test('should complete full purchase flow from home to order success', async ({ page }) => {
    // Step 0: Verify authentication state is loaded by checking a protected route
    await page.goto('/checkout');
    await page.waitForURL(/checkout|login|ciamlogin/, { timeout: 10000 });

    if (page.url().includes('login') || page.url().includes('ciamlogin')) {
      throw new Error(
        'Authentication state not loaded. The storageState from auth.setup.ts may be invalid or expired.',
      );
    }

    // Wait for MSAL to fully initialize and load the account from storage
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    console.log('✓ Authentication verified and MSAL initialized');

    // Step 1: Clear any existing cart
    await clearCart(page);

    // Step 2: Navigate to home and verify products loaded
    await page.goto('/');
    await expect(page).toHaveURL(/\/(products)?$/);

    const productCards = page.locator('[data-testid="featured-card"]');
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });
    const allCards = await productCards.all();
    expect(allCards.length).toBeGreaterThanOrEqual(2);

    // Step 2: Add first product to cart
    await addProductToCart(page, allCards[0]);
    await pause(page, 'First product added to cart');

    // Step 3: Verify cart badge shows 1
    await expect(page.locator('[data-testid="cart-badge"]')).toHaveText('1');

    // Step 4: Add second product to cart
    await addProductToCart(page, allCards[1]);

    // Step 5: Verify cart badge shows 2
    await expect(page.locator('[data-testid="cart-badge"]')).toHaveText('2');

    // Step 6: Navigate to cart page
    await page
      .locator('a, button')
      .filter({ hasText: /cart|Cart/i })
      .first()
      .click();
    await expect(page).toHaveURL('/cart');
    await expect(page.locator('[data-testid="cart-item"]').first()).toBeVisible({ timeout: 5000 });
    await pause(page, 'Arrived at cart page');

    // Step 7: Verify both products are in cart
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2);

    // Step 8: Increment quantity of first product
    const firstCartItem = page.locator('[data-testid="cart-item"]').first();
    const quantitySelector = firstCartItem.locator('[data-testid="quantity-selector"]');
    await quantitySelector.locator('[data-testid="qty-increase"]').click();
    await pause(page, 'First product quantity incremented to 2');

    // Step 9: Verify quantity updated to 2
    const quantityInput = quantitySelector.locator('[data-testid="qty-input"]');
    await expect(quantityInput).toHaveValue('2');

    // Step 10: Verify total item count is 3
    await expect(page.locator('[data-testid="order-summary-panel"]')).toContainText('3');

    // Step 11: Remove second product from cart
    // Wait for Angular to stabilize before clicking remove button
    await page.waitForTimeout(1000);

    const secondCartItem = page.locator('[data-testid="cart-item"]').nth(1);
    await secondCartItem.locator('[data-testid*="remove-btn"]').first().click({ force: true });

    // Step 12: Verify only 1 item remains
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1, { timeout: 10000 });
    await pause(page, 'Second product removed from cart');

    // Step 13: Verify item count is now 2
    await expect(page.locator('[data-testid="order-summary-panel"]')).toContainText('2');

    // Step 14: Reload cart page to force MSAL to re-initialize
    // This ensures MSAL's in-memory cache is populated from cookies before navigating to protected route
    console.log('🔄 Reloading cart page to reinitialize MSAL');
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
      console.log('⚠ Network idle timeout after reload - continuing anyway');
    });

    // Wait a bit for MSAL to process the handleRedirectPromise and load account from cache
    await page.waitForTimeout(1000);

    console.log('✓ MSAL should be reinitialized');

    // Step 15: Navigate to checkout
    await page.locator('[data-testid="order-summary-panel"]').locator('app-button').first().click();

    // Step 16: Verify checkout page loaded (not redirected to login)
    await expect(page).toHaveURL('/checkout', { timeout: 10000 });
    await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible({ timeout: 10000 });
    await pause(page, 'Arrived at checkout page');

    // Step 16: Fill shipping information
    await fillShippingForm(page);
    await pause(page, 'Shipping form filled');

    // Step 17: Select first shipping option if available
    const firstShippingOption = page.locator('input[type="radio"]').first();
    if (await firstShippingOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstShippingOption.click();
    }

    // Step 18: Fill payment details
    await fillStripePaymentForm(page, STRIPE_CARD);
    await pause(page, 'Payment details filled');

    // Step 19: Wait for optional fields to settle, then scroll button into view
    await page.waitForTimeout(1000); // Allow optional fields to expand
    const placeOrderBtn = page.locator('[data-testid="checkout-submit-button"]');
    await placeOrderBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300); // Small delay after scrolling

    // Step 20: Place order
    await placeOrderBtn.click();

    // Step 21: Verify order success
    await expect(page).toHaveURL('/order-success', { timeout: 15000 });
    await expect(
      page
        .locator('h1, h2')
        .filter({ hasText: /success|thank/i })
        .first(),
    ).toBeVisible();
    await pause(page, '✅ ORDER SUCCESS - Test completed!');
  });
});
