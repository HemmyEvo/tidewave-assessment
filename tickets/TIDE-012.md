# TIDE-012: Artist opt-ins reference a closed campaign

**Area**: Engine / Public Website
**Severity**: Medium
**Environment**: Starter build, Solace Avenue artist opt-in
**Retest Status**: Open

## Summary

The artist opt-in record is associated with `coastline-ep`, a campaign that tells visitors it has closed, while Harmattan Sessions is the active campaign.

## Steps to Reproduce

1. Submit the artist opt-in form with a test-domain address.
2. Inspect the new opt-in's `campaign_slug` in the read-only QA database.
3. Open the corresponding campaign page.

## Expected Behavior

The artist opt-in should reference the current open campaign, or be explicitly campaign-independent. It should not direct the visitor to a closed campaign.

## Actual Behavior

The persisted opt-in `opt_f4a19b0339a4d95e4b` has `campaign_slug=coastline-ep`. `GET /campaigns/coastline-ep` returns `200`, but the page states, “This campaign has closed.”

## Evidence

- Opt-in request ID: `req_f840940df4b6d7c439`.
- Read-only database query confirmed `source=Artist`, `consent=true`, and `campaign_slug=coastline-ep`.
- The active campaign page is `/campaigns/harmattan-sessions`.

## Notes

The event workflow now maps consented artist opt-ins to the active campaign when preparing the email; the upstream opt-in record remains incorrect until the closed engine can be changed.
