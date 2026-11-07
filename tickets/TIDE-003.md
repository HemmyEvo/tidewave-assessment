# TIDE-003: Score of exactly 70 is not invited to screening

**Area**: Leads Service  
**Severity**: Medium  
**Environment**: Starter build, `POST /leads`  
**Retest Status**: Fixed

## Summary

The scoring status boundary uses `score > 70`, while the product rule says scores of 70 or higher receive `screening_invite`.

## Steps to Reproduce

1. Submit a lead with 1 year of experience, 10 hours per week, and Lagos as the city.
2. This combination scores exactly 70.
3. Inspect the returned status.

## Expected Behavior

The response status is `screening_invite`.

## Actual Behavior

The starter service returned `needs_review` for lead `lead_1794065697090_rcnig` with score 70.

## Evidence

- `POST /leads` returned HTTP 201 and `{ "status": "needs_review" }`.
- Regression coverage: Playwright API test `TIDE-003: a score of exactly 70 invites screening`.

## Notes

The boundary comparison was changed to `>= 70`.
