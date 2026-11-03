import { test, expect } from '@playwright/test';

test.describe('3. Checkout & Payment Flows', () => {
  test('prompts login if guest customer attempts to proceed to checkout', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // 1. Add product to cart
    const firstProduct = page.locator('.product-card').first();
    await firstProduct.locator('.add-to-cart-btn, button:has-text("Add to Cart")').first().click();

    // 2. Open cart drawer
    const cartButton = page.locator('.cart-icon, [title*="cart" i], .icon-wrapper.cart-icon').first();
    await cartButton.click();

    // 3. Click Proceed to Checkout
    const checkoutBtn = page.locator('button.checkout-btn:has-text("Proceed to Checkout")');
    await checkoutBtn.click();

    // 4. Auth Modal should pop up prompting sign-in
    const authModal = page.locator('.auth-modal-card');
    await expect(authModal).toBeVisible({ timeout: 5000 });
  });

  test.describe('Authenticated Checkout', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      // Seed authenticated user in localStorage
      await page.evaluate(() => {
        localStorage.clear();
        localStorage.setItem('vr_nuts_user', JSON.stringify({
          id: 'test_user_e2e',
          name: 'Vijay Kumar',
          email: 'vijay_test@vrnuts.com',
          phone: '9840123456',
          city: 'Kumbakonam',
          state: 'Tamil Nadu',
          addresses: []
        }));
        localStorage.setItem('vr_nuts_token', 'test_e2e_mock_jwt');
      });
      await page.reload();
    });

    test('navigates from cart to checkout form and displays delivery inputs', async ({ page }) => {
      // 1. Add product to cart
      const firstProduct = page.locator('.product-card').first();
      await firstProduct.locator('.add-to-cart-btn, button:has-text("Add to Cart")').first().click();

      // 2. Open cart drawer
      const cartButton = page.locator('.cart-icon, [title*="cart" i], .icon-wrapper.cart-icon').first();
      await cartButton.click();

      // 3. Click Proceed to Checkout
      const checkoutBtn = page.locator('button.checkout-btn:has-text("Proceed to Checkout")');
      await checkoutBtn.click();

      // 4. Verify checkout form appears with delivery fields
      await expect(page.locator('input[placeholder*="recipient" i], input[placeholder*="name" i]').first()).toBeVisible();
      await expect(page.locator('input[placeholder*="mobile" i], input[type="tel"]').first()).toBeVisible();
      await expect(page.locator('input[placeholder*="Door No" i], input[placeholder*="Street" i]').first()).toBeVisible();
      await expect(page.locator('input[placeholder*="City" i]').first()).toBeVisible();
      await expect(page.locator('input[placeholder*="Pincode" i]').first()).toBeVisible();
    });

    test('completes an order via Cash on Delivery and displays success confirmation', async ({ page }) => {
      // 1. Add product to cart
      const firstProduct = page.locator('.product-card').first();
      await firstProduct.locator('.add-to-cart-btn, button:has-text("Add to Cart")').first().click();

      // 2. Open cart drawer & proceed to checkout
      const cartButton = page.locator('.cart-icon, [title*="cart" i], .icon-wrapper.cart-icon').first();
      await cartButton.click();
      await page.locator('button.checkout-btn:has-text("Proceed to Checkout")').click();

      // 3. Fill required shipping address fields
      await page.fill('input[placeholder*="Door No" i], input[placeholder*="Street" i]', '12, Gandhi Salai');
      await page.fill('input[placeholder*="City" i]', 'Kumbakonam');
      await page.fill('input[placeholder*="Pincode" i]', '612001');

      // 4. Select Cash on Delivery (COD)
      const codCard = page.locator('.payment-card:has-text("Cash on Delivery")');
      await codCard.click();

      // 5. Submit COD Order
      const placeOrderBtn = page.locator('button.checkout-btn:has-text("Place Order")');
      await placeOrderBtn.click();

      // 6. Verify order success screen appears with Order Confirmation
      const successHeader = page.locator('.cart-success-view');
      await expect(successHeader).toBeVisible({ timeout: 10000 });
    });

    test('initiates Razorpay payment mode without crashing', async ({ page }) => {
      // 1. Add product to cart
      const firstProduct = page.locator('.product-card').first();
      await firstProduct.locator('.add-to-cart-btn, button:has-text("Add to Cart")').first().click();

      // 2. Open cart drawer & proceed to checkout
      await page.locator('.cart-icon, [title*="cart" i], .icon-wrapper.cart-icon').first().click();
      await page.locator('button.checkout-btn:has-text("Proceed to Checkout")').click();

      // 3. Fill shipping details
      await page.fill('input[placeholder*="Door No" i], input[placeholder*="Street" i]', '5th Street');
      await page.fill('input[placeholder*="City" i]', 'Thanjavur');
      await page.fill('input[placeholder*="Pincode" i]', '613001');

      // 4. Ensure Razorpay option is selected
      const razorpayCard = page.locator('.payment-card:has-text("Razorpay")');
      await razorpayCard.click();

      // 5. Verify the Pay with Razorpay button is ready
      const payBtn = page.locator('button.checkout-btn:has-text("Razorpay")');
      await expect(payBtn).toBeVisible();
      await expect(payBtn).toBeEnabled();
    });
  });
});
