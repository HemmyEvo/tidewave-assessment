import { expect, test } from '@playwright/test';

test('TIDE-001: Solace marketing consent starts unchecked', async ({ page }) => {
  test.fail();
  await page.goto('/artist/solace-avenue');
  await expect(page.locator('input[name="consent"]')).not.toBeChecked();
});

test('TIDE-013: rapid double-click does not submit opt-in twice', async ({ page }) => {
  test.fail();
  let submissions = 0;
  await page.route('**/optin', async (route) => {
    submissions += 1;
    await new Promise((resolve) => setTimeout(resolve, 200));
    await route.fulfill({
      status: 303,
      headers: { location: '/artist/solace-avenue?done=1' },
      body: '',
    });
  });

  await page.goto('/artist/solace-avenue');
  const consent = page.locator('input[name="consent"]');
  if (!(await consent.isChecked())) await consent.check();
  await page.getByLabel('First name').fill('QA Double Click');
  await page.getByLabel('Email').fill(`qa-double-${Date.now()}@tidewave.test`);
  await page.getByRole('button', { name: 'Get updates' }).dblclick({ delay: 50 });

  await page.waitForTimeout(500);
  expect(submissions).toBe(1);
});

test('visitor can start the Solace Avenue music preview', async ({ page }) => {
  await page.goto('/artist/solace-avenue');
  await page.getByRole('button', { name: 'Play preview' }).click();
  await expect(page.getByRole('button', { name: 'Pause preview' })).toBeVisible();
});

test('visitor can submit an explicit Solace Avenue opt-in', async ({ page }) => {
  const email = `qa-optin-${Date.now()}@tidewave.test`;
  const optinResponse = page.waitForResponse(
    (response) => response.url().endsWith('/optin') && response.request().method() === 'POST'
  );

  await page.goto('/artist/solace-avenue');
  const consent = page.locator('input[name="consent"]');
  if (!(await consent.isChecked())) await consent.check();
  await page.getByLabel('First name').fill('QA Listener');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Get updates' }).click();

  const response = await optinResponse;
  expect(response.status()).toBe(303);
  await expect(page).toHaveURL(/done=1/);
});

test('persona can sign in and view their own account', async ({ page }) => {
  await page.goto('/login?next=%2Fme');
  await page.getByLabel('Username').fill('ada');
  await page.getByLabel('Password').fill('listen123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/me');

  await expect(page.getByRole('heading', { name: /Hello, Ada/i })).toBeVisible();
  await expect(page.getByText('Harmattan Sessions')).toBeVisible();
  await expect(page.getByText(/Confirmed backing:/)).toBeVisible();
});

test('unauthenticated visitors cannot enter checkout', async ({ page }) => {
  await page.goto('/checkout?campaign=harmattan-sessions');
  await expect(page).toHaveURL(/\/login\?/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

test('marketing consent is optional and not preselected on the campaign opt-in form', async ({
  page,
}) => {
  await page.goto('/campaigns/harmattan-sessions');
  await expect(page.locator('input[name="consent"]')).not.toBeChecked();
});

test('active campaign is available and closed campaign is not offered for backing', async ({
  page,
}) => {
  await page.goto('/campaigns/harmattan-sessions');
  await expect(page.getByRole('heading', { name: 'Harmattan Sessions' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back this campaign' })).toBeVisible();

  const closedCampaign = await page.request.get('http://localhost:7080/campaigns/coastline-ep');
  expect(closedCampaign.status()).toBe(200);
  await page.goto('/campaigns/coastline-ep');
  await expect(page.getByText(/closed|no longer accepting/i)).toBeVisible();
});
