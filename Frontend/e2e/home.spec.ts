import { test, expect } from '@playwright/test';

test('should load home page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL('/products');
});
