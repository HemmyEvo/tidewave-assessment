# TIDE-010: Production can start with publicly documented default credentials

**Area**: Leads Service  
**Severity**: High  
**Environment**: Starter build, production configuration  
**Retest Status**: Fixed

## Summary

The service previously fell back to assessment tokens and an event-signing secret when environment variables were absent, including in production. A deployment that omitted the variables would accept publicly known credentials.

## Steps to Reproduce

1. Start the compiled service with `NODE_ENV=production`.
2. Leave the staff, automation, tools, and signing-secret variables unset.
3. Inspect the exported configuration or authenticate using the documented defaults.

## Expected Behavior

Production startup fails with a clear configuration error when required credentials are missing.

## Actual Behavior

The starter configuration populated the missing values from hard-coded assessment defaults.

## Evidence

- Static review of `leads-service/src/config.ts`.
- Regression coverage: `leads-service/test/config.test.ts`.

## Notes

Local development retains assessment defaults; production now requires every credential to be supplied by the deployment environment.
