# Tidewave n8n Starter Workflows

This directory contains starter n8n workflows for the Tidewave assessment.

## Workflows Overview

1. **`street-team-lead.json`** (`POST /webhook/street-team-lead`)  
   Verifies the signed `lead.created` event, fetches the lead, and sends a screening invitation only when the lead is consented and has `screening_invite` status. It rejects non-test recipients, deduplicates by lead, renders the `street-team-prospect` template, retries SMTP delivery, and records an `email_sent` activity. It never changes a lead's status.

2. **`solace-events.json`** (`POST /webhook/solace-events`)  
   Verifies signed engine events and deduplicates opt-ins and payment confirmations. `optin.created` sends only for consented artist opt-ins and links to the active Harmattan Sessions campaign. `payment.updated` always queries the engine's provider-verified payment endpoint; only succeeded payments on an open campaign can reach the confirmation email step. HTTP and SMTP nodes retry transient errors.

3. **`staff-test-run.json`** (`POST /webhook/staff-test-run`)  
   Validates the approved template and required variables, renders a test version, and sends only to `staff-test@tidewave.test`. The recipient is fixed in the workflow, independent of request variables.

## Importing Workflows

Workflows are designed for **n8n 2.42.0** and use only standard built-in nodes.

### CLI Import
```bash
n8n import:workflow --input=workflows/street-team-lead.json
n8n import:workflow --input=workflows/solace-events.json
n8n import:workflow --input=workflows/staff-test-run.json
```

### Credentials
These workflows reference pre-provisioned credentials:
- `cred_mailpit_smtp`: Mailpit SMTP configuration (host: `mailpit`, port: `1025`)
- `cred_tidewave_automation`: HTTP Header Authentication with `tw_automation_3b7e11`

Engine events use `X-Tidewave-Signature`; the workflows verify this signature through the Leads Service before using event data. The event-delivery endpoint must be the published `http://n8n:5678/webhook/solace-events` URL, not n8n's temporary `webhook-test` route.
