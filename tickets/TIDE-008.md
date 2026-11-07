# TIDE-008: Missing template variables render as the word undefined

**Area**: Leads Service  
**Severity**: Medium  
**Environment**: Starter build, `POST /templates/:key/render`  
**Retest Status**: Fixed

## Summary

When a caller omits a template variable, the renderer converts `undefined` to the literal string `"undefined"`. For URL variables, that value is also emitted as a link destination.

## Steps to Reproduce

1. Call the authorized render endpoint for `street-team-prospect`.
2. Provide only `firstName` and omit `nextStepText` and `screeningUrl`.
3. Inspect the rendered HTML.

## Expected Behavior

Missing values use a safe, sensible fallback, and generated links do not contain a literal `undefined` or unsafe URL scheme.

## Actual Behavior

The rendered HTML contained `<p>undefined</p>` and `<a href="undefined">`.

## Evidence

- Baseline `POST /templates/street-team-prospect/render` returned HTTP 200 with both values set to `undefined`.
- Regression coverage: leads-service template unit tests and Playwright API test `TIDE-008: template rendering applies safe fallbacks`.

## Notes

The renderer now uses metadata examples, a neutral fallback name, and safe URL protocols.
