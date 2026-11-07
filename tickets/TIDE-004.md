# TIDE-004: Duplicate detection treats email casing as different people

**Area**: Leads Service  
**Severity**: Medium  
**Environment**: Starter build, `POST /leads`  
**Retest Status**: Fixed

## Summary

The duplicate query compares email addresses case-sensitively. Submitting the same address with different letter casing creates a second lead instead of linking it as a duplicate.

## Steps to Reproduce

1. Submit a lead with a unique test email address.
2. Submit the same email in uppercase with a different phone number.
3. Inspect both responses.

## Expected Behavior

The second submission has status `duplicate` and `duplicateOf` references the first lead.

## Actual Behavior

Both submissions returned HTTP 201 with `duplicateOf: null`; the generated IDs were `lead_1794065695774_www7b` and `lead_1794065696996_u7e5g`.

## Evidence

- Test-domain address used: `qa-dupe-1794065693992@tidewave.test`.
- Regression coverage: Playwright API test `TIDE-004: email duplicate detection ignores casing`.

## Notes

The service now trims and lowercases incoming email addresses and compares them against trimmed, case-folded stored addresses.
