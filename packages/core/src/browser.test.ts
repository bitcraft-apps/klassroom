import { describe, it, expect } from 'vitest';
import { VERSION } from './browser.js';
import { VERSION as MainVersion } from './index.js';

describe('browser entry point', () => {
  describe('VERSION', () => {
    it('is exported from browser entry point', () => {
      expect(typeof VERSION).toBe('string');
    });

    it('matches main entry point VERSION', () => {
      expect(VERSION).toBe(MainVersion);
    });
  });
});
