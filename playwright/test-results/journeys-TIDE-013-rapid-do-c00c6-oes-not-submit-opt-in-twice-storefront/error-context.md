# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: storefront\journeys.spec.ts >> TIDE-013: rapid double-click does not submit opt-in twice
- Location: tests\storefront\journeys.spec.ts:9:5

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
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | test('TIDE-001: Solace marketing consent starts unchecked', async ({ page }) => {
  4  |   test.fail();
  5  |   await page.goto('/artist/solace-avenue');
  6  |   await expect(page.locator('input[name="consent"]')).not.toBeChecked();
  7  | });
  8  | 
  9  | test('TIDE-013: rapid double-click does not submit opt-in twice', async ({ page }) => {
  10 |   test.fail();
  11 |   let submissions = 0;
  12 |   await page.route('**/optin', async (route) => {
  13 |     submissions += 1;
  14 |     await new Promise((resolve) => setTimeout(resolve, 200));
  15 |     await route.fulfill({
  16 |       status: 303,
  17 |       headers: { location: '/artist/solace-avenue?done=1' },
  18 |       body: '',
  19 |     });
  20 |   });
  21 | 
  22 |   await page.goto('/artist/solace-avenue');
  23 |   const consent = page.locator('input[name="consent"]');
  24 |   if (!(await consent.isChecked())) await consent.check();
  25 |   await page.getByLabel('First name').fill('QA Double Click');
  26 |   await page.getByLabel('Email').fill(`qa-double-${Date.now()}@tidewave.test`);
  27 |   await page.getByRole('button', { name: 'Get updates' }).dblclick({ delay: 50 });
  28 | 
  29 |   await page.waitForTimeout(500);
> 30 |   expect(submissions).toBe(1);
     |                       ^ Error: expect(received).toBe(expected) // Object.is equality
  31 | });
  32 | 
  33 | test('visitor can start the Solace Avenue music preview', async ({ page }) => {
  34 |   await page.goto('/artist/solace-avenue');
  35 |   await page.getByRole('button', { name: 'Play preview' }).click();
  36 |   await expect(page.getByRole('button', { name: 'Pause preview' })).toBeVisible();
  37 | });
  38 | 
  39 | test('visitor can submit an explicit Solace Avenue opt-in', async ({ page }) => {
  40 |   const email = `qa-optin-${Date.now()}@tidewave.test`;
  41 |   const optinResponse = page.waitForResponse(
  42 |     (response) => response.url().endsWith('/optin') && response.request().method() === 'POST'
  43 |   );
  44 | 
  45 |   await page.goto('/artist/solace-avenue');
  46 |   const consent = page.locator('input[name="consent"]');
  47 |   if (!(await consent.isChecked())) await consent.check();
  48 |   await page.getByLabel('First name').fill('QA Listener');
  49 |   await page.getByLabel('Email').fill(email);
  50 |   await page.getByRole('button', { name: 'Get updates' }).click();
  51 | 
  52 |   const response = await optinResponse;
  53 |   expect(response.status()).toBe(303);
  54 |   await expect(page).toHaveURL(/done=1/);
  55 | });
  56 | 
  57 | test('persona can sign in and view their own account', async ({ page }) => {
  58 |   await page.goto('/login?next=%2Fme');
  59 |   await page.getByLabel('Username').fill('ada');
  60 |   await page.getByLabel('Password').fill('listen123');
  61 |   await page.getByRole('button', { name: 'Sign in' }).click();
  62 |   await page.waitForURL('**/me');
  63 | 
  64 |   await expect(page.getByRole('heading', { name: /Hello, Ada/i })).toBeVisible();
  65 |   await expect(page.getByText('Harmattan Sessions')).toBeVisible();
  66 |   await expect(page.getByText(/Confirmed backing:/)).toBeVisible();
  67 | });
  68 | 
  69 | test('unauthenticated visitors cannot enter checkout', async ({ page }) => {
  70 |   await page.goto('/checkout?campaign=harmattan-sessions');
  71 |   await expect(page).toHaveURL(/\/login\?/);
  72 |   await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  73 | });
  74 | 
  75 | test('marketing consent is optional and not preselected on the campaign opt-in form', async ({
  76 |   page,
  77 | }) => {
  78 |   await page.goto('/campaigns/harmattan-sessions');
  79 |   await expect(page.locator('input[name="consent"]')).not.toBeChecked();
  80 | });
  81 | 
  82 | test('active campaign is available and closed campaign is not offered for backing', async ({
  83 |   page,
  84 | }) => {
  85 |   await page.goto('/campaigns/harmattan-sessions');
  86 |   await expect(page.getByRole('heading', { name: 'Harmattan Sessions' })).toBeVisible();
  87 |   await expect(page.getByRole('link', { name: 'Back this campaign' })).toBeVisible();
  88 | 
  89 |   const closedCampaign = await page.request.get('http://localhost:7080/campaigns/coastline-ep');
  90 |   expect(closedCampaign.status()).toBe(200);
  91 |   await page.goto('/campaigns/coastline-ep');
  92 |   await expect(page.getByText(/closed|no longer accepting/i)).toBeVisible();
  93 | });
  94 | 
```