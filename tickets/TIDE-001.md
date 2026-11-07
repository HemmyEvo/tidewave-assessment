# TIDE-001: Solace marketing consent is checked by default

**Area**: Public Website  
**Severity**: High  
**Environment**: Starter build, visitor opt-in flow  
**Retest Status**: Open (closed engine)

## Summary

The Solace Avenue artist-page opt-in form renders its marketing-consent checkbox as checked before the visitor makes a choice. Product notes require this checkbox to be unticked by default.

## Steps to Reproduce

1. Open `http://localhost:7080/artist/solace-avenue` in a fresh browser context.
2. Inspect the consent checkbox in the “Get updates from Solace Avenue” form.

## Expected Behavior

The marketing-consent checkbox is unchecked until the visitor chooses to opt in.

## Actual Behavior

The checkbox is checked on initial page load. A Playwright DOM check returned `true`.

## Evidence

- Baseline request: `GET /artist/solace-avenue` returned `200`.
- The Playwright test `TIDE-001: marketing consent starts unchecked` is marked as an expected failure while the closed engine remains unchanged.

## Notes

This is a consent-default defect; the checkbox should not be preselected.
