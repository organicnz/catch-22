/**
 * Product catalog sorting and display utilities.
 *
 * Implements deterministic ordering for Catch-22 fishing braid spools:
 * Length: 300m -> 500m -> 1000m
 * Weight: 10lb -> 18lb -> 28lb -> 40lb -> 50lb -> 60lb -> 80lb -> 100lb -> 120lb
 */

const BRAID_REGEX = /^(\d+)\s*m\s+(\d+)\s*lb$/i;

export interface ProductLike {
  name: string;
  [key: string]: unknown;
}

export function parseBraidSpecs(name: string): { length: number; weight: number } | null {
  const match = name.trim().match(BRAID_REGEX);
  if (!match) return null;
  return {
    length: parseInt(match[1], 10),
    weight: parseInt(match[2], 10),
  };
}

export function sortCatalogProducts<T extends ProductLike>(products: T[]): T[] {
  return [...products].sort((a, b) => {
    const braidA = parseBraidSpecs(a.name);
    const braidB = parseBraidSpecs(b.name);

    // Both are braid spools: sort length ascending (300m < 500m < 1000m), then weight ascending
    if (braidA && braidB) {
      if (braidA.length !== braidB.length) {
        return braidA.length - braidB.length;
      }
      return braidA.weight - braidB.weight;
    }

    // Braid spools come before other products in the store showcase
    if (braidA && !braidB) return -1;
    if (!braidA && braidB) return 1;

    // Non-braid products preserve relative order
    return 0;
  });
}
