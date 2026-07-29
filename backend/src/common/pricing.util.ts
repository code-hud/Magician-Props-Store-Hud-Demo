/**
 * Shared monetary helpers used across the store.
 *
 * Small, dependency-free utilities for coercing, rounding and formatting
 * currency amounts. Kept generic so any module can reuse them.
 */

const CURRENCY_SCALE = 100;

/**
 * Coerce an arbitrary value into a safe, non-negative monetary number.
 *
 * Postgres `decimal` columns come back as strings, and user-supplied amounts
 * can be null/undefined or negative noise, so this guarantees callers never
 * round or persist a malformed value.
 */
export function normalizeAmount(value: number | string | null | undefined): number {
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  if (parsed == null || Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    return 0;
  }
  return parsed < 0 ? 0 : parsed;
}

/** Round a monetary amount to 2 decimal places. */
export function roundCurrency(amount: number): number {
  return Math.round(normalizeAmount(amount) * CURRENCY_SCALE) / CURRENCY_SCALE;
}

/** Format a monetary amount as a display string, e.g. "$1,234.50". */
export function formatCurrency(amount: number): string {
  return `$${roundCurrency(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Sum line items (quantity * price) into a single rounded total. */
export function sumLineItems(
  items: { quantity: number | string; price: number | string }[],
): number {
  const total = items.reduce(
    (acc, item) => acc + normalizeAmount(item.price) * normalizeAmount(item.quantity),
    0,
  );
  return roundCurrency(total);
}

/**
 * Apply a manual price override to an amount.
 *
 * When an override is supplied it wins; otherwise the original amount is
 * returned (rounded). Used by the back-office refund flow, where staff can
 * override a refund total.
 */
export function applyPriceOverride(
  amount: number,
  override?: number | null,
): number {
  if (override == null) {
    return roundCurrency(amount);
  }
  return roundCurrency(normalizeAmount(override));
}

export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
}

/**
 * Apply a promotional discount to a subtotal and return the payable amount.
 *
 * Percentage discounts treat `value` as a percent (e.g. 15 → 15% off); fixed
 * discounts subtract `value` directly from the subtotal.
 */
export function applyDiscount(subtotal: number, discount: Discount): number {
  const base = normalizeAmount(subtotal);
  const reduction =
    discount.type === 'percentage'
      ? base * (normalizeAmount(discount.value) / 100)
      : normalizeAmount(discount.value);
  const payable = Math.max(0, base - reduction);
  return Math.round(payable * CURRENCY_SCALE) / CURRENCY_SCALE;
}
