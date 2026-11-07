import { expect, Page, test } from '@playwright/test';

async function signInAsAda(page: Page) {
  await page.goto('/login?next=%2Fme');
  await page.getByLabel('Username').fill('ada');
  await page.getByLabel('Password').fill('listen123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/me');
}

async function payListener(page: Page, cardNumber: string) {
  await page.goto('/campaigns/harmattan-sessions');
  await page.getByRole('link', { name: 'Back this campaign' }).click();
  await page.getByRole('button', { name: /Become a Listener/ }).click();
  await page.getByLabel('I understand backing is voluntary and is not an investment.').check();
  await page.getByRole('button', { name: 'Review backing' }).click();
  await page.getByRole('button', { name: 'Pay with FakePay' }).click();
  await page.waitForURL('**/pay/**');
  await page.getByLabel('Card number').fill(cardNumber);
  await page.getByLabel('Expiry').fill('12/30');
  await page.getByLabel('CVC').fill('123');
  await page.getByRole('button', { name: /Pay/ }).click();
  await page.waitForURL(/\/checkout\/return/);

  return new URL(page.url()).searchParams.get('payment');
}

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
  await expect(page.getByRole('heading', { name: 'Harmattan Sessions' })).toBeVisible();
  await expect(page.getByText(/Confirmed backing:/)).toBeVisible();
});

test.describe('FakePay payment journeys', () => {
  test.describe.configure({ mode: 'serial' });

  test('successful FakePay payment appears as confirmed backing', async ({ page }) => {
    await signInAsAda(page);
    const messagesBefore = await countMessagesToAda(page);
    const paymentId = await payListener(page, '4242 4242 4242 4242');

    if (!paymentId) throw new Error('Successful payment did not return a payment ID');
    await expect(page).toHaveURL(/status=success/);
    await expect(page.getByRole('heading', { name: "You're in!" })).toBeVisible();

    await page.goto('/me/contributions');
    await expect(page.getByRole('row').nth(1)).toContainText('succeeded');
    await expect.poll(() => countMessagesToAda(page), { timeout: 20_000 }).toBe(messagesBefore + 1);
  });

  test('FakePay decline webhook replay does not create another payment or confirmation email', async ({
    page,
  }) => {
    await signInAsAda(page);
    await page.goto('/me/contributions');
    const failedBefore = await page.getByRole('row').filter({ hasText: 'failed' }).count();
    const messagesBefore = await countMessagesToAda(page);

    const paymentId = await payListener(page, '4000 0000 0000 0002');
    if (!paymentId) throw new Error('Failed payment did not return a payment ID');
    await expect(page).toHaveURL(/status=failed/);
    await expect(page.getByRole('heading', { name: 'Payment not completed' })).toBeVisible();

    await page.goto('http://localhost:7090/dashboard');
    const paymentRow = page.getByRole('row').filter({ hasText: paymentId! });
    const fakePayRef = await paymentRow.getByRole('cell').nth(1).innerText();
    const eventRow = page
      .getByRole('row')
      .filter({ hasText: fakePayRef })
      .filter({ hasText: 'payment.failed' });
    await eventRow.getByRole('button', { name: 'Replay' }).click();
    await page.waitForURL(/replayed=/);

    await page.goto('/me/contributions');
    await expect(page.getByRole('row').filter({ hasText: 'failed' })).toHaveCount(failedBefore + 1);
    expect(await countMessagesToAda(page)).toBe(messagesBefore);
  });
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
  await expect(page.getByText('This campaign has closed.', { exact: true })).toBeVisible();
});

async function countMessagesToAda(page: Page) {
  const response = await page.request.get('http://localhost:7025/api/v1/messages?limit=100');
  expect(response.status()).toBe(200);
  const body = await response.json();
  return body.messages.filter((message: { To: Array<{ Address: string }> }) =>
    message.To.some((recipient) => recipient.Address === 'ada.obi@example.test')
  ).length;
}
