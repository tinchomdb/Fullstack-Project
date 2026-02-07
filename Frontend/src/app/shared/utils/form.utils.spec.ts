import { generateSlug } from './form.utils';

describe('form.utils', () => {
  describe('generateSlug', () => {
    it('should convert spaces to hyphens', () => {
      expect(generateSlug('hello world')).toBe('hello-world');
    });

    it('should convert to lowercase', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Hello, World!')).toBe('hello-world');
    });

    it('should collapse multiple hyphens', () => {
      expect(generateSlug('hello---world')).toBe('hello-world');
    });

    it('should collapse multiple spaces', () => {
      expect(generateSlug('hello   world')).toBe('hello-world');
    });

    it('should handle empty string', () => {
      expect(generateSlug('')).toBe('');
    });

    it('should remove unicode characters', () => {
      expect(generateSlug('café latte')).toBe('caf-latte');
    });

    it('should preserve numbers', () => {
      expect(generateSlug('Product 123')).toBe('product-123');
    });

    it('should preserve existing hyphens', () => {
      expect(generateSlug('already-slugged')).toBe('already-slugged');
    });
  });
});
