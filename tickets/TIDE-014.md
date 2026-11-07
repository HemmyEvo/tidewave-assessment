# TIDE-014: Viewer credential can refund a backing

**Area**: Engine
**Severity**: High
**Environment**: Starter build, authenticated as Viewer
**Retest Status**: Open (closed engine)

## Summary

The engine accepts a refund request authenticated with the Viewer credential, despite the product rule that refunds are admin-only.

## Steps to Reproduce

1. Authenticate a staff payments request with the Admin credential and select a payment with `succeeded` status.
2. Submit `POST /api/staff/refunds` with the Viewer credential and body `{ "paymentId": "<succeeded payment id>" }`.
3. Inspect the response and re-read that payment's status using the Admin credential.

## Expected Behavior

The engine rejects a Viewer refund request with HTTP 403 and leaves the payment in `succeeded` status.

## Actual Behavior

The request returned HTTP 200 with `{ "ok": true }`; the payment changed from `succeeded` to `refunded`.

## Evidence

- Playwright regression test: `viewer credentials cannot issue a refund` in `playwright/tests/api/engine.spec.ts`.
- Runtime verification: Admin and Viewer credentials were different; payment `pay_5c215abccb885d13aa` was `succeeded` before the Viewer request and `refunded` afterward.
- The test run also recorded HTTP 200 where it expected HTTP 403.

## Notes

The engine is closed source in this assessment. The separate ops-console API denies Viewer refund requests, but that does not prevent direct calls to the engine endpoint with Viewer credentials.
