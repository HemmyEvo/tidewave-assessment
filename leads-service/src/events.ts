import crypto, { timingSafeEqual } from 'crypto';
import { config } from './config';

export interface LeadCreatedEventPayload {
  id: string;
  type: 'lead.created';
  createdAt: string;
  data: {
    leadId: string;
    status: string;
    email: string;
    firstName: string;
  };
}

export function signPayload(timestamp: number, rawBody: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${timestamp}.${rawBody}`);
  return `t=${timestamp},v1=${hmac.digest('hex')}`;
}

export function verifyPayload(rawBody: string, signature: string, secret: string): boolean {
  const match = /^t=(\d+),v1=([a-f0-9]{64})$/i.exec(signature);
  if (!match) {
    return false;
  }

  const timestamp = Number(match[1]);
  const supplied = Buffer.from(match[2], 'hex');
  const expected = Buffer.from(
    signPayload(timestamp, rawBody, secret).slice('t='.length + match[1].length + 4),
    'hex'
  );
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function sendLeadCreatedEvent(event: LeadCreatedEventPayload): Promise<boolean> {
  const rawBody = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signPayload(timestamp, rawBody, config.eventsSigningSecret);

  try {
    const response = await fetch(config.n8nLeadsEventsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tidewave-Event-Id': event.id,
        'X-Tidewave-Signature': signature,
      },
      body: rawBody,
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(`[Event] n8n webhook returned status ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    // We catch and log so an unreachable webhook doesn't crash the server process
    console.warn(`[Event] Could not deliver event ${event.id} to n8n webhook:`, (error as Error).message);
    return false;
  }
}
