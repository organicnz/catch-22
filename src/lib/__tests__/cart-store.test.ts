import { beforeEach, describe, expect, it, vi } from 'vitest';

// zustand/persist touches localStorage on every state write; jsdom in this
// project doesn't provide one. Stub before the store module is imported.
vi.hoisted(() => {
  const map = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
});

import { MAX_ITEM_QUANTITY, useCartStore } from '@/lib/store/cart';

const reset = () => useCartStore.setState({ items: [] });

const item = (id: number, quantity = 1) => ({
  id,
  name: `Product ${id}`,
  price: 100,
  quantity,
  image_url: null,
  slug: `product-${id}`,
});

describe('useCartStore clamps', () => {
  beforeEach(reset);

  it('addItem caps quantity at MAX_ITEM_QUANTITY for existing lines', () => {
    useCartStore.getState().addItem(item(1, MAX_ITEM_QUANTITY));
    useCartStore.getState().addItem(item(1, 50));
    expect(useCartStore.getState().items[0].quantity).toBe(MAX_ITEM_QUANTITY);
  });

  it('addItem caps quantity for new lines', () => {
    useCartStore.getState().addItem(item(2, 5000));
    expect(useCartStore.getState().items[0].quantity).toBe(MAX_ITEM_QUANTITY);
  });

  it('updateQuantity removes the line when dropping to zero', () => {
    useCartStore.getState().addItem(item(3, 2));
    useCartStore.getState().updateQuantity(3, 0);
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('updateQuantity never exceeds the cap', () => {
    useCartStore.getState().addItem(item(4, 5));
    useCartStore.getState().updateQuantity(4, 99999);
    expect(useCartStore.getState().items[0].quantity).toBe(MAX_ITEM_QUANTITY);
  });
});
