import { describe, expect, it, mock } from 'bun:test';

// Test through the sanctioned seam: mock the validated env layer, then
// dynamically import paypal so it binds to the mocked env. (Touching
// process.env directly for server vars is forbidden by the
// no-raw-env-access hook.)
describe('isPayPalConfigured', () => {
  it('is false when only scaffold placeholders are present', async () => {
    mock.module('@/lib/env', () => ({
      env: {
        PAYPAL_CLIENT_ID: 'your_paypal_client_id',
        PAYPAL_CLIENT_SECRET: 'your_paypal_client_secret',
      },
    }));
    const { isPayPalConfigured } = await import('../paypal');
    expect(isPayPalConfigured()).toBe(false);
  });
});
