import { test, expect } from '@playwright/test';

test.describe('2. Customer Authentication & Auth Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('opens Auth Modal and switches between Sign In and Sign Up tabs', async ({ page }) => {
    // Click Sign In button in header
    const signInBtn = page.locator('.header-signin-btn, button:has-text("Sign In")').first();
    await signInBtn.click();

    // Verify modal appears
    const modal = page.locator('.auth-modal-card');
    await expect(modal).toBeVisible();

    // Verify tabs exist
    const signUpTab = page.locator('.auth-tab-btn:has-text("Sign Up")');
    const signInTab = page.locator('.auth-tab-btn:has-text("Sign In")');
    await expect(signUpTab).toBeVisible();
    await expect(signInTab).toBeVisible();

    // Switch to Sign Up
    await signUpTab.click();
    await expect(page.locator('h2.auth-title')).toHaveText(/Create an Account/i);

    // Switch back to Sign In
    await signInTab.click();
    await expect(page.locator('h2.auth-title')).toHaveText(/Welcome Back/i);
  });

  test('displays error alert when submitting invalid login credentials', async ({ page }) => {
    const signInBtn = page.locator('.header-signin-btn, button:has-text("Sign In")').first();
    await signInBtn.click();

    await page.fill('#signin-email', 'nonexistent_test_user@vrnuts.com');
    await page.fill('#signin-password', 'wrongpassword123');

    const submitBtn = page.locator('button.auth-submit-btn:has-text("Sign In")');
    await submitBtn.click();

    // An error alert should appear
    const alertMsg = page.locator('.auth-alert.error');
    await expect(alertMsg).toBeVisible({ timeout: 5000 });
  });

  test('blocks duplicate registration with already registered phone number', async ({ page }) => {
    const signUpBtn = page.locator('.header-signup-btn, button:has-text("Sign Up")').first();
    await signUpBtn.click();

    // Fill registration form with known registered phone 8940473703
    await page.getByPlaceholder('Enter Full Name').fill('Test Customer');
    await page.getByPlaceholder('Enter Email Address').fill('unique_new_email_99@test.com');
    await page.getByPlaceholder('Enter Phone Number').fill('8940473703');
    await page.getByPlaceholder('Enter Password').fill('Password123');

    // Submit
    const submitBtn = page.getByRole('button', { name: /Create Account/i });
    await submitBtn.click();

    // Verify the error message for already registered phone appears
    const alertMsg = page.locator('.auth-alert.error');
    await expect(alertMsg).toBeVisible({ timeout: 5000 });
    await expect(alertMsg).toContainText(/already registered/i);
  });
});
