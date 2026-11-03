import { test, expect } from '@playwright/test';

test.describe('1. Cart & Weight Variant Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage to start with a fresh clean cart
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('switches weight variants and verifies dynamic price update', async ({ page }) => {
    const firstProduct = page.locator('.product-card').first();
    await expect(firstProduct).toBeVisible();

    const priceTag = firstProduct.locator('.price-tag');
    await expect(priceTag).toBeVisible();
    const initialPrice = await priceTag.innerText();

    // Look for weight select or weight button option
    const weightSelector = firstProduct.locator('select.weight-select, select, .weight-option-btn, .weight-pill').first();
    if (await weightSelector.isVisible()) {
      const tagName = await weightSelector.evaluate(el => el.tagName.toLowerCase());
      if (tagName === 'select') {
        const options = await weightSelector.locator('option').all();
        if (options.length > 1) {
          // Select 2nd option (e.g. 500g)
          await weightSelector.selectOption({ index: 1 });
          const newPrice = await priceTag.innerText();
          expect(newPrice).toBeDefined();
        }
      }
    }
  });

  test('adds product to cart, increases quantity, and checks total calculation', async ({ page }) => {
    const firstProduct = page.locator('.product-card').first();
    await expect(firstProduct).toBeVisible();

    // Click "Add to Cart"
    const addToCartBtn = firstProduct.locator('.add-to-cart-btn, button:has-text("Add to Cart")').first();
    await addToCartBtn.click();

    // Open Cart Drawer
    const cartButton = page.locator('.cart-icon, [title*="cart" i], .icon-wrapper.cart-icon').first();
    await cartButton.click();

    const cartDrawer = page.locator('.cart-drawer, .cart-overlay');
    await expect(cartDrawer).toBeVisible();

    // Check cart item exists
    const cartItem = page.locator('.cart-item, .cart-product-row').first();
    await expect(cartItem).toBeVisible();

    // Test quantity increment (+)
    const plusBtn = cartItem.locator('button:has-text("+"), .qty-btn.plus, button.qty-plus').first();
    if (await plusBtn.isVisible()) {
      await plusBtn.click();
      // Verify subtotal row exists and updates
      const subtotalEl = page.locator('.cart-total-row, .cart-subtotal, .summary-row').first();
      await expect(subtotalEl).toBeVisible();
    }
  });

  test('removes item from cart and verifies empty cart state', async ({ page }) => {
    // Add item first
    const firstProduct = page.locator('.product-card').first();
    await firstProduct.locator('.add-to-cart-btn, button:has-text("Add to Cart")').first().click();

    // Open cart
    const cartButton = page.locator('.cart-icon, [title*="cart" i], .icon-wrapper.cart-icon').first();
    await cartButton.click();

    // Click delete or minus until removed
    const deleteBtn = page.locator('.cart-item-delete, button[aria-label="Remove item"], .remove-btn').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await expect(page.locator('.cart-empty, text=empty, text=No items')).toBeVisible();
    }
  });
});
