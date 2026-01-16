import { describe, it, expect } from 'vitest';
import { VERSION } from './index.js';

describe('VERSION', () => {
  it('is exported as a string', () => {
    expect(typeof VERSION).toBe('string');
  });

  it('follows semver format', () => {
    // Semver: MAJOR.MINOR.PATCH with optional prerelease/build metadata
    const semverRegex = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;
    expect(VERSION).toMatch(semverRegex);
  });

  it('matches package.json version', async () => {
    const packageJson = await import('../package.json');
    expect(VERSION).toBe(packageJson.version);
  });
});
