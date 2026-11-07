# TIDE-013: Rapid double-click submits artist opt-in twice

**Area**: Public Website
**Severity**: Medium
**Environment**: Starter build, Solace Avenue opt-in form
**Retest Status**: Open (closed engine)

## Summary

The artist opt-in form accepts a rapid double-click on its submit button and sends two `POST /optin` requests for one visitor action.

## Steps to Reproduce

1. Open `/artist/solace-avenue` in a fresh browser context.
2. Fill in a first name and unique test-domain email.
3. Double-click “Get updates” before the first request completes.
4. Count the resulting `POST /optin` requests.

## Expected Behavior

One user action should create at most one opt-in request. The submit control should prevent repeat submissions while the request is in flight, and the server should safely handle retries.

## Actual Behavior

A Playwright browser check intercepted two `POST /optin` requests from one double-click. The request handler delayed each response to reproduce the in-flight window.

## Evidence

- Live check output: `optin POST count after double click: 2`.
- Reproduced on `http://localhost:7080/artist/solace-avenue`.
- Regression test: `TIDE-013: rapid double-click does not submit opt-in twice` in `playwright/tests/storefront/journeys.spec.ts`.

## Notes

The public engine and website are closed components in this assessment; the defect is documented and the test is marked as an expected failure until those components can be changed.
