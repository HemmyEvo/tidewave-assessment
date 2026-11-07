import { Router, Request, Response } from 'express';
import { config } from '../config';
import { requireAutomation } from '../auth';
import { verifyPayload } from '../events';

export const automationRouter = Router();

automationRouter.post('/events/verify', requireAutomation, (req: Request, res: Response) => {
  const event = req.body?.event;
  const signature = req.get('X-Tidewave-Signature') || '';

  if (!event || typeof event !== 'object' || Array.isArray(event) || !signature) {
    res.status(401).json({ error: 'A signed event is required' });
    return;
  }

  if (!verifyPayload(JSON.stringify(event), signature, config.eventsSigningSecret)) {
    res.status(401).json({ error: 'Invalid event signature' });
    return;
  }

  res.json({ verified: true });
});
