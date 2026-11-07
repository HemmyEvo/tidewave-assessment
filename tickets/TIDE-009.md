# TIDE-009: PR-17 duplicate cleanup deletes the older canonical lead

**Area**: Leads Service  
**Severity**: Critical  
**Environment**: Open PR review, `leads-service/pull-requests/PR-17/PR-17.diff`  
**Retest Status**: Open (not merged)

## Summary

The proposed cleanup migration selects the older row (`l1.created_at < l2.created_at`) and deletes it. This removes the earliest/canonical record rather than preserving it. The join also matches all same-email records, including rows that are not marked as duplicates and rows for which consent was withdrawn.

## Steps to Reproduce

1. Review the proposed `004_cleanup_duplicates.sql` in PR-17.
2. Insert or inspect two same-email records with different timestamps.
3. Apply the migration to a disposable database and inspect which record remains.

## Expected Behavior

Cleanup should be a reviewed, reversible operation that preserves the canonical lead and its history, and only handles confirmed duplicates under the consent rules.

## Actual Behavior

The `DELETE` predicate targets the older matching row and deletes its activity before deleting the lead. The migration is not present in the current migrations directory and was not applied to the assessment database.

## Evidence

- Static review of `pull-requests/PR-17/PR-17.diff`, added migration lines 1–18.

## Notes

Do not merge as proposed. Prefer a report-only cleanup query and explicit retention criteria before any destructive cleanup.
