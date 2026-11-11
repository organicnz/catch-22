import { describe, expect, it } from 'bun:test';
import { parseBraidSpecs, sortCatalogProducts } from '../products';

describe('parseBraidSpecs', () => {
  it('parses valid braid name formats', () => {
    expect(parseBraidSpecs('300m 10lb')).toEqual({ length: 300, weight: 10 });
    expect(parseBraidSpecs('300m 28lb')).toEqual({ length: 300, weight: 28 });
    expect(parseBraidSpecs('500m 120lb')).toEqual({ length: 500, weight: 120 });
    expect(parseBraidSpecs('1000m 120lb')).toEqual({ length: 1000, weight: 120 });
  });

  it('returns null for non-braid products', () => {
    expect(parseBraidSpecs('Mini Digital Scale')).toBeNull();
    expect(parseBraidSpecs('Silicon Soft Baits x 5')).toBeNull();
  });
});

describe('sortCatalogProducts', () => {
  it('sorts braid spools by length (300m -> 500m -> 1000m) and weight (10lb -> 120lb)', () => {
    const raw = [
      { name: '1000m 120lb' },
      { name: '300m 120lb' },
      { name: '300m 28lb' },
      { name: '500m 50lb' },
      { name: '300m 10lb' },
      { name: '1000m 10lb' },
      { name: '500m 10lb' },
      { name: '300m 40lb' },
      { name: '300m 18lb' },
    ];

    const sorted = sortCatalogProducts(raw);

    expect(sorted.map((p) => p.name)).toEqual([
      '300m 10lb',
      '300m 18lb',
      '300m 28lb',
      '300m 40lb',
      '300m 120lb',
      '500m 10lb',
      '500m 50lb',
      '1000m 10lb',
      '1000m 120lb',
    ]);
  });

  it('places braid spools first and keeps non-braid products after', () => {
    const raw = [
      { name: 'Mini Digital Scale' },
      { name: '300m 28lb' },
      { name: 'Catch Cap' },
      { name: '300m 10lb' },
    ];

    const sorted = sortCatalogProducts(raw);

    expect(sorted.map((p) => p.name)).toEqual([
      '300m 10lb',
      '300m 28lb',
      'Mini Digital Scale',
      'Catch Cap',
    ]);
  });
});
