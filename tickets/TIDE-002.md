# TIDE-002: Opt-in events are sent to an unregistered n8n test webhook

**Area**: Engine / n8n  
**Severity**: High  
**Environment**: Starter build, Solace opt-in flow  
**Retest Status**: Fixed (runtime verified)

## Summary

The engine event setting points to n8n's `webhook-test` route, but the published workflow listens on the production `webhook/solace-events` route. Opt-in events are persisted but never reach the workflow.

## Steps to Reproduce

1. Submit the artist opt-in form using a test-domain address.
2. Inspect `engine.settings.n8n_events_url` with the read-only QA role.
3. Inspect the corresponding `engine.outbox` row and the published workflow path.

## Expected Behavior

The engine posts to the published `solace-events` webhook and receives a successful response.

## Actual Behavior

The engine posted to `http://n8n:5678/webhook-test/solace-events`; the outbox entry `evt_48ff6b083e6cbd8789` had five attempts, last status `404`, and no `delivered_at` value.

## Evidence

- Opt-in request ID: `req_f840940df4b6d7c439` (`POST /optin`, HTTP 303).
- QA database: opt-in `opt_f4a19b0339a4d95e4b`; event `evt_48ff6b083e6cbd8789`.
- The workflow is published at `POST /webhook/solace-events`.
- The engine now targets `http://n8n:5678/webhook/solace-events`.
- A new event was delivered with HTTP 200 after five attempts; Mailpit received the corresponding welcome email.
- Replaying that event returned `ok: true` and left the recipient's Mailpit message count at one.

## Notes

The workflow JSON includes stable webhook IDs required for n8n 2.42 to register the published production URLs. The original failed event remains in the outbox as historical evidence; a subsequent event and replay verified the repaired delivery path.
