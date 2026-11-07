import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('production configuration', () => {
  it('does not start with the assessment token defaults in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    for (const name of [
      'STAFF_ADMIN_TOKEN',
      'STAFF_VIEWER_TOKEN',
      'AUTOMATION_TOKEN',
      'TOOLS_TOKEN',
      'EVENTS_SIGNING_SECRET',
    ]) {
      vi.stubEnv(name, '');
    }

    await expect(import('../src/config')).rejects.toThrow(
      'STAFF_ADMIN_TOKEN must be configured in production'
    );
  });
});
