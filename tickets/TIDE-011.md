# TIDE-011: Template key is used directly to construct filesystem paths

**Area**: Leads Service  
**Severity**: Medium  
**Environment**: Starter build, `POST /templates/:key/render`  
**Retest Status**: Fixed

## Summary

The template renderer joined a route-controlled key to the templates directory without restricting the key to a template identifier. Path separators could escape the intended directory when a matching JSON/HTML pair existed.

## Steps to Reproduce

1. Review the `path.join(dir, ...)` calls in `leads-service/src/templates.ts`.
2. Send a path-like value as `:key` to the authorized render endpoint.

## Expected Behavior

Only template keys made from letters, digits, and hyphens resolve.

## Actual Behavior

The starter renderer passed the route parameter directly to `path.join`.

## Evidence

- Static code review of the original `renderTemplate` implementation.
- Regression coverage: `leads-service/test/templates.test.ts` and Playwright API test `template renderer rejects path-like template keys`.

## Notes

The renderer now rejects path-like keys before reading files.
