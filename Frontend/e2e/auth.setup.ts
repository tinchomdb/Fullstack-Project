import { test as setup, expect } from '@playwright/test';
import { environment as devEnvironment } from '../src/environments/environment';
import { environment as prodEnvironment } from '../src/environments/environment.prod';

const AUTH_FILE = 'playwright/.auth/user.json';

const TEST_CREDENTIALS = {
  email: process.env['TEST_USER_EMAIL'] || '',
  password: process.env['TEST_USER_PASSWORD'] || '',
} as const;

const LOGIN_URL_PATTERN = /login|microsoft|accounts|ciamlogin/;

// Build APP_PATTERN from environment URLs to match localhost in dev or Azure domain in CI
const environment = process.env.CI ? prodEnvironment : devEnvironment;
const APP_DOMAIN = new URL(environment.appUrl).hostname;
const LOCALHOST_PATTERN = new RegExp(APP_DOMAIN.replace(/\./g, '\\.'));

/**
 * Find the Microsoft login context (might be in iframe or main page)
 */
function getLoginContext(page: any): any {
  const loginFrame = page.frames().find((frame: any) => LOGIN_URL_PATTERN.test(frame.url()));

  if (loginFrame) {
    console.log('✓ Login context found in iframe');
    return loginFrame;
  }

  console.log('✓ Login context is on main page');
  return page;
}

/**
 * Find and fill an input, trying multiple possible names
 */
async function fillInput(
  context: any,
  names: string[],
  value: string,
  label: string,
): Promise<void> {
  for (const name of names) {
    const input = context.locator(`input[name="${name}"]`);
    const isVisible = await input.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      console.log(`✓ Found ${label} input: name="${name}"`);
      await input.fill(value);
      await context.page().waitForTimeout(300);
      return;
    }
  }

  throw new Error(`Could not find ${label} input. Tried: ${names.join(', ')}`);
}

/**
 * Find and click a button, trying multiple selectors
 */
async function clickButton(context: any, selectors: string[], label: string): Promise<void> {
  for (const selector of selectors) {
    const button = context.locator(selector).first();
    const isVisible = await button.isVisible({ timeout: 2000 }).catch(() => false);

    if (isVisible) {
      console.log(`✓ Clicking ${label}`);
      await button.click();
      await context.page().waitForTimeout(500);
      return;
    }
  }

  throw new Error(`Could not find ${label} button`);
}

setup('authenticate', async ({ page }) => {
  // Navigate to protected route to trigger authentication
  await page.goto('/checkout');

  // Wait for redirect to Microsoft login
  await page.waitForURL(LOGIN_URL_PATTERN, { timeout: 25000 });

  // Wait for page to be interactive
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
    console.log('⚠ Network idle timeout (expected for some login flows)');
  });

  // Give Microsoft's form time to render
  await page.waitForTimeout(2000);

  const loginContext = getLoginContext(page);

  // Step 1: Fill email
  await fillInput(loginContext, ['loginfmt', 'username'], TEST_CREDENTIALS.email, 'email');

  // Step 2: Click Next
  await clickButton(
    loginContext,
    [
      'input[value="Next"]',
      'button:has-text("Next")',
      '#idSIButton9',
      '[data-report-value="Submit"]',
    ],
    'Next button',
  );

  // Step 3: Fill password (might be in different iframe after navigation)
  await page.waitForLoadState('domcontentloaded');
  const passwordContext = getLoginContext(page);

  await fillInput(passwordContext, ['passwd', 'password'], TEST_CREDENTIALS.password, 'password');

  // Step 4: Click Sign in
  await clickButton(
    passwordContext,
    [
      'input[value="Sign in"]',
      'button:has-text("Sign in")',
      '#idSIButton9',
      '[data-report-value="Submit"]',
    ],
    'Sign in button',
  );

  // Step 5: Handle "Stay signed in?" prompt if present
  await page.waitForLoadState('domcontentloaded');
  const confirmContext = getLoginContext(page);

  const staySignedBtn = confirmContext.locator('input[value="Yes"]');
  const shouldStaySignedIn = await staySignedBtn.isVisible({ timeout: 3000 }).catch(() => false);

  if (shouldStaySignedIn) {
    console.log('✓ Answering "Stay signed in?" prompt');
    await staySignedBtn.click();
    await page.waitForTimeout(500);
  }

  // Step 6: Wait for redirect back to app
  await page.waitForURL(LOCALHOST_PATTERN, { timeout: 20000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // Step 7: Verify authenticated
  await expect(page).toHaveURL(LOCALHOST_PATTERN);
  console.log('✓ Authentication successful');

  // Step 8: Save authentication state
  await page.context().storageState({ path: AUTH_FILE });
  console.log(`✓ Auth state saved to ${AUTH_FILE}`);
});
