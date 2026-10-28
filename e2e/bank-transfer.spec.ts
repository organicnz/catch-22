import { expect, test } from '@playwright/test';

/**
 * Bank-transfer checkout UI contract.
 *
 * Deliberately does NOT submit an order: `createBankTransferOrder` writes to
 * the real `orders`/`order_items` tables, so a passing run would litter the
 * owner's admin with on-hold test orders. Order-creation rules (server-side
 * pricing, coupon validation, stock checks) are covered by unit tests in
 * `src/lib/__tests__/bank-transfer-order.test.ts`; the real end-to-end test
 * is the owner placing a live order with a real transfer.
 *
 * The cart store is seeded via localStorage (zustand persist key
 * `catch-22-cart`) so the page hydrates straight into its form.
 */

const CART_KEY = 'catch-22-cart';

interface SeedItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

function seedCart(items: SeedItem[]): string {
  return JSON.stringify({
    state: {
      items: items.map((item) => ({ ...item, image_url: null, slug: `e2e-${item.id}` })),
    },
    version: 0,
  });
}

const ONE_ITEM: SeedItem[] = [{ id: 16, name: 'Braid Test Line', price: 25, quantity: 2 }];

async function withCart(page: import('@playwright/test').Page, items: SeedItem[]) {
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: CART_KEY, value: seedCart(items) }
  );
}

test.describe('bank-transfer checkout', () => {
  test('fresh visit shows the empty-cart state', async ({ page }) => {
    await page.goto('/checkout/bank-transfer');
    await expect(page.getByRole('heading', { name: 'Your Cart is Empty' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bank Transfer Checkout' })).toBeHidden();
  });

  test('seeded cart shows the full form, summary and estimated total', async ({ page }) => {
    await withCart(page, ONE_ITEM);
    await page.goto('/checkout/bank-transfer');

    await expect(page.getByRole('heading', { name: 'Bank Transfer Checkout' })).toBeVisible();

    // Customer + address fieldsets and every required field.
    for (const id of ['firstName', 'lastName', 'email', 'phone', 'address1', 'city', 'postcode']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }

    // All shipping methods are offered; standard is preselected.
    await expect(page.locator('input[name="shippingMethod"]')).toHaveCount(5);
    await expect(page.locator('input[name="shippingMethod"][value="standard"]')).toBeChecked();

    // Summary math from the seeded cart: 2 × $25 + $8 standard = $58.
    await expect(page.getByText('Braid Test Line')).toBeVisible();
    await expect(page.getByText('$58.00')).toBeVisible();

    // Switching to pick-up (free) re-computes the estimate to $50.00.
    await page.locator('input[name="shippingMethod"][value="pickup"]').check();
    await expect(page.getByText('$50.00').first()).toBeVisible();
  });

  test('promo code passed from the cart URL pre-fills the field', async ({ page }) => {
    await withCart(page, ONE_ITEM);
    await page.goto('/checkout/bank-transfer?promo=catch10');
    await expect(page.getByRole('heading', { name: 'Bank Transfer Checkout' })).toBeVisible();
    await expect(page.locator('#promoCode')).toHaveValue('catch10');
  });

  test('empty required fields are blocked before any order is created', async ({ page }) => {
    await withCart(page, ONE_ITEM);
    await page.goto('/checkout/bank-transfer');
    await page.getByRole('button', { name: /Place Order/i }).click();

    // HTML5 validation focuses the first invalid field and keeps the form up —
    // the success panel must NOT appear.
    await expect(page.locator('#firstName')).toBeFocused();
    await expect(page.getByRole('heading', { name: 'Order reserved' })).toBeHidden();
  });

  test('NZ payment options comparison guide opens and details all options', async ({ page }) => {
    await withCart(page, ONE_ITEM);
    await page.goto('/checkout/bank-transfer');

    // Click "Compare all NZ payment avenues" button
    const guideBtn = page.getByRole('button', { name: /Compare all NZ payment avenues/i });
    await expect(guideBtn).toBeVisible();
    await guideBtn.click();

    // Dialog title appears
    await expect(
      page.getByRole('heading', { name: /NZ Payment Options & Protections/i })
    ).toBeVisible();
    // Reassurance of 0% surcharge and consumer rights
    await expect(page.getByText('Zero Surcharges Guaranteed')).toBeVisible();
    await expect(page.getByText('Direct Bank Transfer (NZD)')).toBeVisible();
    await expect(page.getByText('Afterpay & Klarna (NZD)')).toBeVisible();
    await expect(page.getByText('Chatswood, Auckland Pick-up')).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: /Close payment options/i }).click();
    await expect(
      page.getByRole('heading', { name: /NZ Payment Options & Protections/i })
    ).toBeHidden();
  });

  test('NZ rural delivery assistant detects RD in address and offers one-click switch', async ({
    page,
  }) => {
    await withCart(page, ONE_ITEM);
    await page.goto('/checkout/bank-transfer');

    // Standard courier is selected by default ($58.00 total)
    await expect(page.locator('input[name="shippingMethod"][value="standard"]')).toBeChecked();

    // Type RD address into address1
    await page.locator('#address1').fill('144 Mahurangi East Road, RD 2');

    // Assistant should appear
    await expect(page.getByText(/Rural Delivery \(RD\) Address Detected/i)).toBeVisible();

    // Click "Switch to Rural Delivery Courier"
    await page.getByRole('button', { name: /Switch to Rural Delivery Courier/i }).click();

    // Now rural shipping should be checked and total updated
    await expect(page.locator('input[name="shippingMethod"][value="rural"]')).toBeChecked();
    // Assistant automatically disappears once rural rate is chosen
    await expect(page.getByText(/Rural Delivery \(RD\) Address Detected/i)).toBeHidden();
  });

  test('NZ bank selector toggles banks and updates clearance speed pill', async ({ page }) => {
    await withCart(page, ONE_ITEM);
    await page.goto('/checkout/bank-transfer');

    // Verify ANZ default is selected and shows "Instant"
    await expect(page.getByText(/Instant ANZ-to-ANZ settlement/i)).toBeVisible();

    // Select ASB Bank
    await page.getByRole('button', { name: /ASB Bank/i }).click();
    // Should display 1-2 hours SBI clearance note
    await expect(page.getByText(/1–2h interbank clearance/i)).toBeVisible();
  });
});
