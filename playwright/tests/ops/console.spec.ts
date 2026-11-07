import { expect, Page, test } from '@playwright/test';

async function signIn(page: Page, role: 'Admin' | 'Viewer') {
  await page.goto('/login');
  await page.getByRole('button', { name: `Sign in as ${role}` }).click();
  await page.waitForURL('**/leads');
}

test('Admin can browse leads and inspect lead activity', async ({ page }) => {
  await signIn(page, 'Admin');
  await expect(page.getByRole('heading', { name: 'Street Team Leads' })).toBeVisible();
  const firstLead = page.locator('tbody tr.clickable').first();
  await expect(firstLead).toBeVisible();
  await firstLead.click();
  await expect(page).toHaveURL(/\/leads\/[^/]+$/);
  await expect(page.getByRole('heading', { name: 'Activity Log' })).toBeVisible();
});

test('Viewer can read leads and payments but cannot trigger refunds', async ({ page }) => {
  await signIn(page, 'Viewer');
  await expect(page.getByRole('heading', { name: 'Street Team Leads' })).toBeVisible();
  await page.goto('/payments');
  await expect(page.getByRole('heading', { name: 'Backing Payments' })).toBeVisible();
  await expect(page.getByText('Admin only').first()).toBeVisible();

  const response = await page.request.post('http://localhost:7300/api/refunds', {
    data: { paymentId: 'pay_538d3108dc14d9fa5e' },
  });
  expect(response.status()).toBe(403);
});

test('Admin can browse backing payments', async ({ page }) => {
  await signIn(page, 'Admin');
  await page.goto('/payments');
  await expect(page.getByRole('heading', { name: 'Backing Payments' })).toBeVisible();
  await expect(page.locator('table tbody tr').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Refund' }).first()).toBeVisible();
});

test('test email screen lists only approved templates and builds a sandboxed live preview', async ({
  page,
}) => {
  await signIn(page, 'Admin');
  await page.goto('/messages/test');

  const selector = page.getByLabel('Approved template');
  await expect(selector).toBeVisible();
  await expect(selector.locator('option')).not.toContainText(/draft/i);
  await selector.selectOption('street-team-prospect');

  const firstName = page.getByLabel(/First Name/);
  await expect(firstName).toHaveAttribute('placeholder', 'Kemi');
  await firstName.fill('QA Preview');
  await page.getByLabel(/Next Step Text/).fill('Choose a time for your screening call.');
  await page.getByLabel(/Screening URL/).fill('http://localhost:7080/street-team/screening');

  const preview = page.locator('iframe[title="Rendered email preview"]');
  await expect(preview).toHaveAttribute('sandbox', '');
  const frame = page.frameLocator('iframe[title="Rendered email preview"]');
  await expect(frame.getByRole('heading', { name: 'Hello QA Preview,' })).toBeVisible();
  await expect(frame.getByRole('link', { name: 'Schedule your screening call' })).toHaveAttribute(
    'href',
    'http://localhost:7080/street-team/screening'
  );
});

test('test email screen sends only to the fixed staff test mailbox', async ({ page }) => {
  await signIn(page, 'Viewer');
  const response = await page.request.post('http://localhost:7300/api/messages/test-run', {
    data: {
      templateKey: 'solace-intro',
      variables: {
        firstName: 'QA Staff',
        campaignUrl: 'http://localhost:7080/campaigns/harmattan-sessions',
        email: 'qa-not-the-recipient@tidewave.test',
      },
    },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(body.recipient).toBe('staff-test@tidewave.test');
});

test('test email screen rejects draft and missing template variables', async ({ page }) => {
  await signIn(page, 'Admin');
  const draft = await page.request.post('http://localhost:7300/api/messages/test-run', {
    data: { templateKey: 'old-promo-draft', variables: {} },
  });
  expect(draft.status()).toBe(422);

  const missing = await page.request.post('http://localhost:7300/api/messages/test-run', {
    data: { templateKey: 'solace-intro', variables: { firstName: 'QA' } },
  });
  expect(missing.status()).toBe(422);
});
