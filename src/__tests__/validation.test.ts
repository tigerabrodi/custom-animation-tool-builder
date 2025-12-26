import { describe, it, expect } from 'vitest';
import { validatePascalCase } from '../utils/validation';

describe('validatePascalCase', () => {
  describe('valid PascalCase strings', () => {
    it('should return true for simple PascalCase', () => {
      expect(validatePascalCase('Hello')).toBe(true);
    });

    it('should return true for multi-word PascalCase', () => {
      expect(validatePascalCase('HelloWorld')).toBe(true);
    });

    it('should return true for single uppercase letter', () => {
      expect(validatePascalCase('A')).toBe(true);
    });

    it('should return true for all uppercase', () => {
      expect(validatePascalCase('ABC')).toBe(true);
    });

    it('should return true for PascalCase with numbers', () => {
      expect(validatePascalCase('Hello123')).toBe(true);
      expect(validatePascalCase('Test2Case')).toBe(true);
      expect(validatePascalCase('Version3')).toBe(true);
    });

    it('should return true for common bone names', () => {
      expect(validatePascalCase('Hips')).toBe(true);
      expect(validatePascalCase('LeftUpLeg')).toBe(true);
      expect(validatePascalCase('RightForeArm')).toBe(true);
      expect(validatePascalCase('Spine02')).toBe(true);
    });
  });

  describe('invalid PascalCase strings', () => {
    it('should return false for empty string', () => {
      expect(validatePascalCase('')).toBe(false);
    });

    it('should return false for lowercase start', () => {
      expect(validatePascalCase('hello')).toBe(false);
      expect(validatePascalCase('helloWorld')).toBe(false);
    });

    it('should return false for strings starting with numbers', () => {
      expect(validatePascalCase('123Hello')).toBe(false);
      expect(validatePascalCase('1Test')).toBe(false);
    });

    it('should return false for strings with underscores', () => {
      expect(validatePascalCase('Hello_World')).toBe(false);
      expect(validatePascalCase('Left_Arm')).toBe(false);
    });

    it('should return false for strings with hyphens', () => {
      expect(validatePascalCase('Hello-World')).toBe(false);
    });

    it('should return false for strings with spaces', () => {
      expect(validatePascalCase('Hello World')).toBe(false);
      expect(validatePascalCase(' Hello')).toBe(false);
    });

    it('should return false for strings with special characters', () => {
      expect(validatePascalCase('Hello!')).toBe(false);
      expect(validatePascalCase('Test@Case')).toBe(false);
      expect(validatePascalCase('Hello.')).toBe(false);
    });

    it('should return false for lowercase bone name exceptions', () => {
      // 'neck' starts lowercase, so it should fail PascalCase validation
      expect(validatePascalCase('neck')).toBe(false);
      expect(validatePascalCase('head_end')).toBe(false);
      expect(validatePascalCase('headfront')).toBe(false);
    });
  });
});
