const SILK_KIT_COMPONENTS = Array.from({ length: 40 }, (_, i) => i + 1);
const WAND_KIT_COMPONENTS = Array.from({ length: 40 }, (_, i) => i + 41);

export const BUNDLE_GRAPH: Record<number, number[]> = {
  5001: [5003, 5004],
  5002: [5, 6],
  5003: [5005, 5006],
  5004: [5005, 5006],
  5005: [5007, 5008, 5007, 5008],
  5006: [5007, 5008, 5007, 5008],
  5007: SILK_KIT_COMPONENTS,
  5008: WAND_KIT_COMPONENTS,
};

export function isBundleProduct(productId: number): boolean {
  return productId in BUNDLE_GRAPH;
}
