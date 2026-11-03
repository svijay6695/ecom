import { test, expect } from '@playwright/test';

test.describe('4. Admin Portal & Live Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to Admin Portal port 5174
    await page.goto('http://localhost:5174/');

    // Seed admin auth in localStorage to ensure portal access
    await page.evaluate(() => {
      localStorage.setItem('vr_nuts_admin_user', JSON.stringify({
        name: 'VP Nuts Administrator',
        email: 'admin@vrnuts.com',
        role: 'admin',
        location: 'Kumbakonam Central Hub'
      }));
      localStorage.setItem('vr_nuts_admin_token', 'test_admin_mock_token');
    });
    await page.reload();
  });

  test('logs into Admin portal and loads Dashboard view', async ({ page }) => {
    // Verify Admin brand title is visible
    const brand = page.locator('.brand-title');
    await expect(brand).toBeVisible();
    await expect(brand).toHaveText(/VP NUTS/i);
  });

  test('navigates to Orders & Tracking view', async ({ page }) => {
    // Click on Orders tab in sidebar
    const ordersTab = page.locator('button.nav-link:has-text("Orders")');
    await ordersTab.click();

    // Verify Orders header/table appears
    const ordersView = page.locator('.orders-view, h1:has-text("Orders"), h2:has-text("Orders")').first();
    await expect(ordersView).toBeVisible();
  });

  test('navigates to Live OTP Tracker view', async ({ page }) => {
    // Click on Live OTP Tracker tab
    const otpTab = page.locator('button.nav-link:has-text("OTP Tracker")');
    await otpTab.click();

    // Verify OTP view container is visible
    const otpContainer = page.locator('.otp-tracker-view, h1:has-text("OTP"), h2:has-text("OTP")').first();
    await expect(otpContainer).toBeVisible();
  });

  test('navigates to Products & Stock inventory view', async ({ page }) => {
    // Click on Products & Stock
    const productsTab = page.locator('button.nav-link:has-text("Products")');
    await productsTab.click();

    // Verify Products list or table is visible
    const productsView = page.locator('.products-page, .products-toolbar').first();
    await expect(productsView).toBeVisible();
  });
});
