# TIDE-005: Viewer credentials can change lead status

**Area**: Leads Service  
**Severity**: High  
**Environment**: Starter build, `PATCH /leads/:id/status`  
**Retest Status**: Fixed

## Summary

The status endpoint is documented as admin-only but uses `requireStaff`, which also permits viewer tokens.

## Steps to Reproduce

1. Create a lead using the public endpoint.
2. Send `PATCH /leads/{id}/status` with a Viewer Bearer token and a valid status.

## Expected Behavior

The Viewer request is rejected with HTTP 403.

## Actual Behavior

The Viewer request returned HTTP 200 and changed lead `lead_1794065695774_www7b`.

## Evidence

- The response from the Viewer-token request contained `status: "active"`.
- Regression coverage: Playwright API test `TIDE-005: viewers cannot change lead status`.

## Notes

The route now requires the existing `requireAdmin` middleware.
