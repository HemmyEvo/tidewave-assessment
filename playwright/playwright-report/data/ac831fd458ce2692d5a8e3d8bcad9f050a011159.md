# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: storefront\journeys.spec.ts >> TIDE-001: Solace marketing consent starts unchecked
- Location: tests\storefront\journeys.spec.ts:28:5

# Error details

```
Error: expect(locator).not.toBeChecked() failed

Locator:  locator('input[name="consent"]')
Expected: not checked
Received: checked
Timeout:  5000ms

Call log:
  - Expect "not toBeChecked" locator('input[name="consent"]') with timeout 5000ms
  - waiting for locator('input[name="consent"]')
    13 × locator resolved to <input checked value="yes" name="consent" type="checkbox"/>
       - unexpected value "checked"

```

```yaml
- checkbox [checked]
```

# Test source

```ts
  1   | import { expect, Page, test } from '@playwright/test';
  2   | 
  3   | async function signInAsAda(page: Page) {
  4   |   await page.goto('/login?next=%2Fme');
  5   |   await page.getByLabel('Username').fill('ada');
  6   |   await page.getByLabel('Password').fill('listen123');
  7   |   await page.getByRole('button', { name: 'Sign in' }).click();
  8   |   await page.waitForURL('**/me');
  9   | }
  10  | 
  11  | async function payListener(page: Page, cardNumber: string) {
  12  |   await page.goto('/campaigns/harmattan-sessions');
  13  |   await page.getByRole('link', { name: 'Back this campaign' }).click();
  14  |   await page.getByRole('button', { name: /Become a Listener/ }).click();
  15  |   await page.getByLabel('I understand backing is voluntary and is not an investment.').check();
  16  |   await page.getByRole('button', { name: 'Review backing' }).click();
  17  |   await page.getByRole('button', { name: 'Pay with FakePay' }).click();
  18  |   await page.waitForURL('**/pay/**');
  19  |   await page.getByLabel('Card number').fill(cardNumber);
  20  |   await page.getByLabel('Expiry').fill('12/30');
  21  |   await page.getByLabel('CVC').fill('123');
  22  |   await page.getByRole('button', { name: /Pay/ }).click();
  23  |   await page.waitForURL(/\/checkout\/return/);
  24  | 
  25  |   return new URL(page.url()).searchParams.get('payment');
  26  | }
  27  | 
  28  | test('TIDE-001: Solace marketing consent starts unchecked', async ({ page }) => {
  29  |   test.fail();
  30  |   await page.goto('/artist/solace-avenue');
> 31  |   await expect(page.locator('input[name="consent"]')).not.toBeChecked();
      |                                                           ^ Error: expect(locator).not.toBeChecked() failed
  32  | });
  33  | 
  34  | test('TIDE-013: rapid double-click does not submit opt-in twice', async ({ page }) => {
  35  |   test.fail();
  36  |   let submissions = 0;
  37  |   await page.route('**/optin', async (route) => {
  38  |     submissions += 1;
  39  |     await new Promise((resolve) => setTimeout(resolve, 200));
  40  |     await route.fulfill({
  41  |       status: 303,
  42  |       headers: { location: '/artist/solace-avenue?done=1' },
  43  |       body: '',
  44  |     });
  45  |   });
  46  | 
  47  |   await page.goto('/artist/solace-avenue');
  48  |   const consent = page.locator('input[name="consent"]');
  49  |   if (!(await consent.isChecked())) await consent.check();
  50  |   await page.getByLabel('First name').fill('QA Double Click');
  51  |   await page.getByLabel('Email').fill(`qa-double-${Date.now()}@tidewave.test`);
  52  |   await page.getByRole('button', { name: 'Get updates' }).dblclick({ delay: 50 });
  53  | 
  54  |   await page.waitForTimeout(500);
  55  |   expect(submissions).toBe(1);
  56  | });
  57  | 
  58  | test('visitor can start the Solace Avenue music preview', async ({ page }) => {
  59  |   await page.goto('/artist/solace-avenue');
  60  |   await page.getByRole('button', { name: 'Play preview' }).click();
  61  |   await expect(page.getByRole('button', { name: 'Pause preview' })).toBeVisible();
  62  | });
  63  | 
  64  | test('visitor can submit an explicit Solace Avenue opt-in', async ({ page }) => {
  65  |   const email = `qa-optin-${Date.now()}@tidewave.test`;
  66  |   const optinResponse = page.waitForResponse(
  67  |     (response) => response.url().endsWith('/optin') && response.request().method() === 'POST'
  68  |   );
  69  | 
  70  |   await page.goto('/artist/solace-avenue');
  71  |   const consent = page.locator('input[name="consent"]');
  72  |   if (!(await consent.isChecked())) await consent.check();
  73  |   await page.getByLabel('First name').fill('QA Listener');
  74  |   await page.getByLabel('Email').fill(email);
  75  |   await page.getByRole('button', { name: 'Get updates' }).click();
  76  | 
  77  |   const response = await optinResponse;
  78  |   expect(response.status()).toBe(303);
  79  |   await expect(page).toHaveURL(/done=1/);
  80  | });
  81  | 
  82  | test('persona can sign in and view their own account', async ({ page }) => {
  83  |   await page.goto('/login?next=%2Fme');
  84  |   await page.getByLabel('Username').fill('ada');
  85  |   await page.getByLabel('Password').fill('listen123');
  86  |   await page.getByRole('button', { name: 'Sign in' }).click();
  87  |   await page.waitForURL('**/me');
  88  | 
  89  |   await expect(page.getByRole('heading', { name: /Hello, Ada/i })).toBeVisible();
  90  |   await expect(page.getByRole('heading', { name: 'Harmattan Sessions' })).toBeVisible();
  91  |   await expect(page.getByText(/Confirmed backing:/)).toBeVisible();
  92  | });
  93  | 
  94  | test.describe('FakePay payment journeys', () => {
  95  |   test.describe.configure({ mode: 'serial' });
  96  | 
  97  |   test('successful FakePay payment appears as confirmed backing', async ({ page }) => {
  98  |     await signInAsAda(page);
  99  |     const messagesBefore = await countMessagesToAda(page);
  100 |     const paymentId = await payListener(page, '4242 4242 4242 4242');
  101 | 
  102 |     if (!paymentId) throw new Error('Successful payment did not return a payment ID');
  103 |     await expect(page).toHaveURL(/status=success/);
  104 |     await expect(page.getByRole('heading', { name: "You're in!" })).toBeVisible();
  105 | 
  106 |     await page.goto('/me/contributions');
  107 |     await expect(page.getByRole('row').nth(1)).toContainText('succeeded');
  108 |     await expect.poll(() => countMessagesToAda(page), { timeout: 20_000 }).toBe(messagesBefore + 1);
  109 |   });
  110 | 
  111 |   test('FakePay decline webhook replay does not create another payment or confirmation email', async ({
  112 |     page,
  113 |   }) => {
  114 |     await signInAsAda(page);
  115 |     await page.goto('/me/contributions');
  116 |     const failedBefore = await page.getByRole('row').filter({ hasText: 'failed' }).count();
  117 |     const messagesBefore = await countMessagesToAda(page);
  118 | 
  119 |     const paymentId = await payListener(page, '4000 0000 0000 0002');
  120 |     if (!paymentId) throw new Error('Failed payment did not return a payment ID');
  121 |     await expect(page).toHaveURL(/status=failed/);
  122 |     await expect(page.getByRole('heading', { name: 'Payment not completed' })).toBeVisible();
  123 | 
  124 |     await page.goto('http://localhost:7090/dashboard');
  125 |     const paymentRow = page.getByRole('row').filter({ hasText: paymentId! });
  126 |     const fakePayRef = await paymentRow.getByRole('cell').nth(1).innerText();
  127 |     const eventRow = page
  128 |       .getByRole('row')
  129 |       .filter({ hasText: fakePayRef })
  130 |       .filter({ hasText: 'payment.failed' });
  131 |     await eventRow.getByRole('button', { name: 'Replay' }).click();
```