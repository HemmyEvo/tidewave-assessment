# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ops\console.spec.ts >> Admin can browse backing payments
- Location: tests\ops\console.spec.ts:36:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:7300/login
Call log:
  - navigating to "http://localhost:7300/login", waiting until "load"

```

# Test source

```ts
  1   | import { expect, Page, test } from '@playwright/test';
  2   | 
  3   | async function signIn(page: Page, role: 'Admin' | 'Viewer') {
> 4   |   await page.goto('/login');
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:7300/login
  5   |   await page.getByRole('button', { name: `Sign in as ${role}` }).click();
  6   |   await page.waitForURL('**/leads');
  7   | }
  8   | 
  9   | test('Admin can browse leads and inspect lead activity', async ({ page }) => {
  10  |   test.setTimeout(60_000);
  11  |   await signIn(page, 'Admin');
  12  |   await expect(page.getByRole('heading', { name: 'Street Team Leads' })).toBeVisible();
  13  |   const firstLead = page.locator('tbody tr.clickable').first();
  14  |   await expect(firstLead).toBeVisible();
  15  |   await firstLead.click();
  16  |   await expect(page).toHaveURL(/\/leads\/[^/]+$/);
  17  |   await expect(page.getByRole('heading', { name: 'Activity Log' })).toBeVisible({
  18  |     timeout: 15_000,
  19  |   });
  20  |   await expect(page.getByText(/"score":\d+/)).toBeVisible();
  21  | });
  22  | 
  23  | test('Viewer can read leads and payments but cannot trigger refunds', async ({ page }) => {
  24  |   await signIn(page, 'Viewer');
  25  |   await expect(page.getByRole('heading', { name: 'Street Team Leads' })).toBeVisible();
  26  |   await page.goto('/payments');
  27  |   await expect(page.getByRole('heading', { name: 'Backing Payments' })).toBeVisible();
  28  |   await expect(page.getByText('Admin only').first()).toBeVisible();
  29  | 
  30  |   const response = await page.request.post('http://localhost:7300/api/refunds', {
  31  |     data: { paymentId: 'pay_538d3108dc14d9fa5e' },
  32  |   });
  33  |   expect(response.status()).toBe(403);
  34  | });
  35  | 
  36  | test('Admin can browse backing payments', async ({ page }) => {
  37  |   await signIn(page, 'Admin');
  38  |   await page.goto('/payments');
  39  |   await expect(page.getByRole('heading', { name: 'Backing Payments' })).toBeVisible();
  40  |   await expect(page.locator('table tbody tr').first()).toBeVisible();
  41  |   await expect(page.getByRole('button', { name: 'Refund' }).first()).toBeVisible();
  42  | });
  43  | 
  44  | test('test email screen lists only approved templates and builds a sandboxed live preview', async ({
  45  |   page,
  46  | }) => {
  47  |   await signIn(page, 'Admin');
  48  |   await page.goto('/messages/test');
  49  | 
  50  |   const selector = page.getByLabel('Approved template');
  51  |   await expect(selector).toBeVisible();
  52  |   const templateNames = await selector.locator('option').allTextContents();
  53  |   expect(templateNames.every((name) => !/draft/i.test(name))).toBe(true);
  54  |   await selector.selectOption('street-team-prospect');
  55  | 
  56  |   const firstName = page.getByLabel(/First Name/);
  57  |   await expect(firstName).toHaveAttribute('placeholder', 'Kemi');
  58  |   await firstName.fill('QA Preview');
  59  |   await page.getByLabel(/Next Step Text/).fill('Choose a time for your screening call.');
  60  |   await page.getByLabel(/Screening URL/).fill('http://localhost:7080/street-team/screening');
  61  | 
  62  |   const preview = page.locator('iframe[title="Rendered email preview"]');
  63  |   await expect(preview).toHaveAttribute('sandbox', '');
  64  |   const frame = page.frameLocator('iframe[title="Rendered email preview"]');
  65  |   await expect(frame.getByRole('heading', { name: 'Hello QA Preview,' })).toBeVisible({
  66  |     timeout: 15_000,
  67  |   });
  68  |   await expect(frame.getByRole('link', { name: 'Schedule your screening call' })).toHaveAttribute(
  69  |     'href',
  70  |     'http://localhost:7080/street-team/screening'
  71  |   );
  72  | });
  73  | 
  74  | test('test email screen sends only to the fixed staff test mailbox', async ({ page }) => {
  75  |   await signIn(page, 'Viewer');
  76  |   const messagesBefore = await countMessagesTo(page, 'staff-test@tidewave.test');
  77  |   const response = await page.request.post('http://localhost:7300/api/messages/test-run', {
  78  |     data: {
  79  |       templateKey: 'solace-intro',
  80  |       variables: {
  81  |         firstName: 'QA Staff',
  82  |         campaignUrl: 'http://localhost:7080/campaigns/harmattan-sessions',
  83  |         email: 'qa-not-the-recipient@tidewave.test',
  84  |       },
  85  |     },
  86  |   });
  87  |   expect(response.status()).toBe(200);
  88  |   const body = await response.json();
  89  |   expect(body.ok).toBe(true);
  90  |   expect(body.recipient).toBe('staff-test@tidewave.test');
  91  |   expect(await countMessagesTo(page, 'staff-test@tidewave.test')).toBe(messagesBefore + 1);
  92  |   expect(await countMessagesTo(page, 'qa-not-the-recipient@tidewave.test')).toBe(0);
  93  | });
  94  | 
  95  | test('test email screen rejects draft and missing template variables', async ({ page }) => {
  96  |   await signIn(page, 'Admin');
  97  |   const draft = await page.request.post('http://localhost:7300/api/messages/test-run', {
  98  |     data: { templateKey: 'old-promo-draft', variables: {} },
  99  |   });
  100 |   expect(draft.status()).toBe(422);
  101 | 
  102 |   const missing = await page.request.post('http://localhost:7300/api/messages/test-run', {
  103 |     data: { templateKey: 'solace-intro', variables: { firstName: 'QA' } },
  104 |   });
```