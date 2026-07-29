import {
  applyDiscount,
  applyPriceOverride,
  formatCurrency,
  normalizeAmount,
  roundCurrency,
  sumLineItems,
} from '../src/common/pricing.util';

describe('pricing.util', () => {
  describe('normalizeAmount', () => {
    it('parses numeric strings from the database', () => {
      expect(normalizeAmount('12.50')).toBe(12.5);
    });

    it('coerces null/undefined/NaN to 0', () => {
      expect(normalizeAmount(null)).toBe(0);
      expect(normalizeAmount(undefined)).toBe(0);
      expect(normalizeAmount('not-a-number')).toBe(0);
    });

    it('clamps negative values to 0', () => {
      expect(normalizeAmount(-5)).toBe(0);
    });
  });

  describe('roundCurrency', () => {
    it('rounds to 2 decimal places', () => {
      expect(roundCurrency(12.345)).toBe(12.35);
      expect(roundCurrency(12.344)).toBe(12.34);
    });
  });

  describe('formatCurrency', () => {
    it('formats with a $ sign and thousands separators', () => {
      expect(formatCurrency(1234.5)).toBe('$1,234.50');
      expect(formatCurrency(0)).toBe('$0.00');
    });
  });

  describe('sumLineItems', () => {
    it('sums quantity * price across items', () => {
      expect(
        sumLineItems([
          { quantity: 2, price: 10 },
          { quantity: 1, price: 5.5 },
        ]),
      ).toBe(25.5);
    });

    it('tolerates string inputs', () => {
      expect(sumLineItems([{ quantity: '3', price: '2.00' }])).toBe(6);
    });
  });

  describe('applyPriceOverride', () => {
    it('returns the rounded original amount when no override is given', () => {
      expect(applyPriceOverride(42.005)).toBe(42.01);
      expect(applyPriceOverride(42, null)).toBe(42);
    });

    it('uses the override when supplied', () => {
      expect(applyPriceOverride(42, 10)).toBe(10);
      expect(applyPriceOverride(42, -5)).toBe(0);
    });
  });

  describe('applyDiscount', () => {
    it('applies a percentage discount', () => {
      expect(applyDiscount(100, { type: 'percentage', value: 10 })).toBe(90);
    });

    it('applies a fixed discount', () => {
      expect(applyDiscount(100, { type: 'fixed', value: 5 })).toBe(95);
    });

    it('never returns a negative payable amount', () => {
      expect(applyDiscount(20, { type: 'fixed', value: 50 })).toBe(0);
    });
  });
});
