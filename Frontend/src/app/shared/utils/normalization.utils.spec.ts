import { ensureString, ensureNumber } from './normalization.utils';

describe('normalization.utils', () => {
  describe('ensureString', () => {
    it('should return the value if it is a string', () => {
      expect(ensureString('hello')).toBe('hello');
    });

    it('should return empty string for empty string input', () => {
      expect(ensureString('')).toBe('');
    });

    it('should return fallback for null', () => {
      expect(ensureString(null)).toBe('');
      expect(ensureString(null, 'default')).toBe('default');
    });

    it('should return fallback for undefined', () => {
      expect(ensureString(undefined)).toBe('');
      expect(ensureString(undefined, 'fallback')).toBe('fallback');
    });

    it('should convert numbers to strings', () => {
      expect(ensureString(42)).toBe('42');
      expect(ensureString(0)).toBe('0');
    });

    it('should convert booleans to strings', () => {
      expect(ensureString(true)).toBe('true');
      expect(ensureString(false)).toBe('false');
    });
  });

  describe('ensureNumber', () => {
    it('should return the value if it is a finite number', () => {
      expect(ensureNumber(42)).toBe(42);
      expect(ensureNumber(0)).toBe(0);
      expect(ensureNumber(-5.5)).toBe(-5.5);
    });

    it('should return fallback for NaN', () => {
      expect(ensureNumber(NaN)).toBe(0);
      expect(ensureNumber(NaN, 99)).toBe(99);
    });

    it('should return fallback for Infinity', () => {
      expect(ensureNumber(Infinity)).toBe(0);
      expect(ensureNumber(-Infinity)).toBe(0);
    });

    it('should return fallback for null', () => {
      expect(ensureNumber(null)).toBe(0);
    });

    it('should return fallback for undefined', () => {
      expect(ensureNumber(undefined)).toBe(0);
    });

    it('should parse numeric strings', () => {
      expect(ensureNumber('42')).toBe(42);
      expect(ensureNumber('3.14')).toBe(3.14);
    });

    it('should return fallback for non-numeric strings', () => {
      expect(ensureNumber('abc')).toBe(0);
      expect(ensureNumber('')).toBe(0);
    });
  });
});
