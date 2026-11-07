import { describe, expect, it } from 'vitest';
import { signPayload, verifyPayload } from '../src/events';

describe('event signature verification', () => {
  it('accepts a matching signed payload', () => {
    const timestamp = 1_800_000_000;
    const body = JSON.stringify({ id: 'evt_test', type: 'lead.created' });
    const signature = signPayload(timestamp, body, 'test-secret');

    expect(verifyPayload(body, signature, 'test-secret')).toBe(true);
  });

  it('rejects altered bodies and malformed signatures', () => {
    const timestamp = 1_800_000_000;
    const body = JSON.stringify({ id: 'evt_test', type: 'lead.created' });
    const signature = signPayload(timestamp, body, 'test-secret');

    expect(verifyPayload(body + ' ', signature, 'test-secret')).toBe(false);
    expect(verifyPayload(body, 't=1,v1=not-a-signature', 'test-secret')).toBe(false);
  });
});
