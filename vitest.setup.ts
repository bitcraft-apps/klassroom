import { vi, beforeAll, afterAll } from 'vitest';

// Store original console.warn
const originalWarn = console.warn;

beforeAll(() => {
  // Suppress canvas-related warnings during tests
  // These are noise from chartjs-node-canvas when canvas isn't fully available
  vi.spyOn(console, 'warn').mockImplementation((msg, ...args) => {
    if (typeof msg === 'string') {
      // Suppress canvas library warnings
      if (msg.includes('Canvas')) return;
      // Suppress chart rendering failure warnings (expected during tests)
      if (msg.startsWith('Failed to render')) return;
    }
    originalWarn.call(console, msg, ...args);
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});
