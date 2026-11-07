# TIDE-007: Nonnumeric lead experience returns an internal server error

**Area**: Leads Service  
**Severity**: Medium  
**Environment**: Starter build, `POST /leads`  
**Retest Status**: Fixed

## Summary

The request schema accepts arbitrary strings for experience and availability. Nonnumeric values pass validation and fail later during the PostgreSQL insert, producing a server error instead of a client validation response.

## Steps to Reproduce

1. Submit a valid lead with `experienceYears: "abc"` and otherwise valid fields.
2. Inspect the response.

## Expected Behavior

Invalid numeric input is rejected with HTTP 422 before any database operation.

## Actual Behavior

The starter endpoint returned HTTP 500 with `{ "error": "Internal server error" }`.

## Evidence

- The request used a unique `@tidewave.test` address and created no lead.
- Regression coverage: Playwright API test `TIDE-007: invalid numeric values are rejected`.

## Notes

The service now coerces numeric strings and validates that values are finite and nonnegative.
