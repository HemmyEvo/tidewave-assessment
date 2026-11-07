# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: storefront\journeys.spec.ts >> TIDE-013: rapid double-click does not submit opt-in twice
- Location: tests\storefront\journeys.spec.ts:34:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 2
```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - banner [ref=f1e2]:
    - generic [ref=f1e3]:
      - link "TidewaveMusic" [ref=f1e4] [cursor=pointer]:
        - /url: /
      - navigation [ref=f1e5]:
        - link "Solace Avenue" [ref=f1e6] [cursor=pointer]:
          - /url: /artist/solace-avenue
        - link "Harmattan Sessions" [ref=f1e7] [cursor=pointer]:
          - /url: /campaigns/harmattan-sessions
        - link "Street Team" [ref=f1e8] [cursor=pointer]:
          - /url: /street-team
        - link "Sign in" [ref=f1e9] [cursor=pointer]:
          - /url: /login
  - main [ref=f1e10]:
    - generic [ref=f1e17]:
      - paragraph [ref=f1e18]: Artist
      - heading "Solace Avenue" [level=1] [ref=f1e19]
      - paragraph [ref=f1e20]:
        - text: Solace Avenue play warm, slow-burning highlife with a jazz rhythm section. Their first EP,
        - emphasis [ref=f1e21]: Coastline
        - text: ", came out in 2025."
      - generic [ref=f1e22]:
        - button "Play preview" [ref=f1e23] [cursor=pointer]: ▶
        - generic [ref=f1e25]: 0:00 / 0:30
    - generic [ref=f1e26]:
      - generic [ref=f1e27]:
        - heading "The band" [level=2] [ref=f1e28]
        - paragraph [ref=f1e29]: Kele (vocals, guitar), Ibi (keys), Rotimi (bass), Aisha (drums), Femi (trumpet). They met playing Sunday sessions in Yaba and have played together since 2021.
        - heading "On tour" [level=2] [ref=f1e30]
        - paragraph [ref=f1e31]: Lagos, Ibadan and Accra dates are announced to people on the mailing list first.
        - heading "Discography" [level=2] [ref=f1e32]
        - list [ref=f1e33]:
          - listitem [ref=f1e34]:
            - strong [ref=f1e35]: Coastline EP
            - text: (2025)
          - listitem [ref=f1e36]:
            - strong [ref=f1e37]: Harmattan Sessions
            - text: "- in progress, see the campaign"
        - paragraph [ref=f1e38]: Photos from the Yaba sessions, the band's influences, and how they record live to tape are on the band's journal page, which opens to people on the list. We keep this page short so the music does the talking.
        - paragraph [ref=f1e39]: The new album is being recorded over five nights. Every track is played live in one room. The band wants the people who follow them to hear it before anyone else, and to know what happens at each step.
      - generic [ref=f1e40]:
        - heading "Get updates from Solace Avenue" [level=2] [ref=f1e41]
        - paragraph [ref=f1e42]: Thanks. Check your inbox.
        - generic [ref=f1e43]:
          - generic [ref=f1e44]: First name
          - textbox "First name" [ref=f1e45]
          - generic [ref=f1e46]: Email
          - textbox "Email" [ref=f1e47]
          - paragraph [ref=f1e48]: We will send you news about the band and the new album. You can unsubscribe at any time.
          - paragraph [ref=f1e49]: Your email is stored by Tidewave Music. We do not sell it.
          - paragraph [ref=f1e51]:
            - checkbox [checked] [ref=f1e52]
            - generic [ref=f1e53]: Yes, email me updates from Solace Avenue and Tidewave Music.
          - button "Get updates" [ref=f1e54] [cursor=pointer]
  - contentinfo [ref=f1e55]:
    - generic [ref=f1e56]: Tidewave Music is a fictional company made for a test. Backing a campaign is voluntary. It is not employment and not an investment.
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
  31  |   await expect(page.locator('input[name="consent"]')).not.toBeChecked();
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
> 55  |   expect(submissions).toBe(1);
      |                       ^ Error: expect(received).toBe(expected) // Object.is equality
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
  132 |     await page.waitForURL(/replayed=/);
  133 | 
  134 |     await page.goto('/me/contributions');
  135 |     await expect(page.getByRole('row').filter({ hasText: 'failed' })).toHaveCount(failedBefore + 1);
  136 |     expect(await countMessagesToAda(page)).toBe(messagesBefore);
  137 |   });
  138 | });
  139 | 
  140 | test('unauthenticated visitors cannot enter checkout', async ({ page }) => {
  141 |   await page.goto('/checkout?campaign=harmattan-sessions');
  142 |   await expect(page).toHaveURL(/\/login\?/);
  143 |   await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  144 | });
  145 | 
  146 | test('marketing consent is optional and not preselected on the campaign opt-in form', async ({
  147 |   page,
  148 | }) => {
  149 |   await page.goto('/campaigns/harmattan-sessions');
  150 |   await expect(page.locator('input[name="consent"]')).not.toBeChecked();
  151 | });
  152 | 
  153 | test('active campaign is available and closed campaign is not offered for backing', async ({
  154 |   page,
  155 | }) => {
```