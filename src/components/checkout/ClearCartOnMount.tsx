'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/lib/store/cart';

/**
 * Clears the persisted cart after a confirmed payment. Rendered by the
 * server-side receipt only when Stripe reports the session as paid, so a
 * manual visit to /success can never wipe someone's cart.
 */
export function ClearCartOnMount() {
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return null;
}
