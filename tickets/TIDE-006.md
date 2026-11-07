# TIDE-006: Leads can be assigned the forbidden active status

**Area**: Leads Service  
**Severity**: High  
**Environment**: Starter build, `PATCH /leads/:id/status`  
**Retest Status**: Fixed

## Summary

The status update endpoint accepts `active`, although the product rules prohibit marking applicants active, hired, or field ready.

## Steps to Reproduce

1. Create or retrieve a lead.
2. Send `PATCH /leads/{id}/status` with `{ "status": "active" }`.

## Expected Behavior

The request is rejected with HTTP 422 and no lead enters the forbidden state.

## Actual Behavior

The starter service returned HTTP 200 and persisted `status: "active"`.

## Evidence

- Reproduced on lead `lead_1794065695774_www7b`.
- Regression coverage: Playwright API test `TIDE-006: active is not an allowed lead status`.

## Notes

The forbidden status was removed from the accepted status list.
