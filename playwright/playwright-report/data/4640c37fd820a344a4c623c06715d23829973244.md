# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api\engine.spec.ts >> TIDE-014: viewer credentials cannot issue a refund
- Location: tests\api\engine.spec.ts:18:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 403
Received: 200
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | const ENGINE = 'http://localhost:7080';
  4  | const ADMIN = 'Bearer tw_staff_admin_5f2c9a';
  5  | const VIEWER = 'Bearer tw_staff_viewer_81d4e0';
  6  | const AUTOMATION = 'Bearer tw_automation_3b7e11';
  7  | 
  8  | test('engine API documentation is available', async ({ request }) => {
  9  |   const response = await request.get(`${ENGINE}/api/docs`);
  10 |   expect(response.status()).toBe(200);
  11 |   await expect(response.text()).resolves.toContain('/api/automation/payments/{paymentId}');
  12 | });
  13 | 
  14 | test('staff payments require credentials', async ({ request }) => {
  15 |   expect((await request.get(`${ENGINE}/api/staff/payments`)).status()).toBe(401);
  16 | });
  17 | 
  18 | test('TIDE-014: viewer credentials cannot issue a refund', async ({ request }) => {
  19 |   test.fail();
  20 |   const payments = await request.get(`${ENGINE}/api/staff/payments`, {
  21 |     headers: { Authorization: ADMIN },
  22 |   });
  23 |   const succeeded = (await payments.json()).find((payment: { status: string }) => payment.status === 'succeeded');
  24 |   expect(succeeded).toBeTruthy();
  25 | 
  26 |   const response = await request.post(`${ENGINE}/api/staff/refunds`, {
  27 |     headers: { Authorization: VIEWER },
  28 |     data: { paymentId: succeeded.id },
  29 |   });
> 30 |   expect(response.status()).toBe(403);
     |                             ^ Error: expect(received).toBe(expected) // Object.is equality
  31 | });
  32 | 
  33 | test('automation payment lookup returns provider-verified payment state', async ({ request }) => {
  34 |   const staffPayments = await request.get(`${ENGINE}/api/staff/payments`, {
  35 |     headers: { Authorization: ADMIN },
  36 |   });
  37 |   const failed = (await staffPayments.json()).find((payment: { status: string }) => payment.status === 'failed');
  38 |   expect(failed).toBeTruthy();
  39 | 
  40 |   const response = await request.get(`${ENGINE}/api/automation/payments/${failed.id}`, {
  41 |     headers: { Authorization: AUTOMATION },
  42 |   });
  43 |   expect(response.status()).toBe(200);
  44 |   expect((await response.json()).status).toBe('failed');
  45 | });
  46 | 
  47 | test('invalid FakePay webhook signature cannot confirm a payment', async ({ request }) => {
  48 |   const response = await request.post(`${ENGINE}/webhooks/fakepay`, {
  49 |     headers: {
  50 |       'Content-Type': 'application/json',
  51 |       'FakePay-Signature': `t=${Math.floor(Date.now() / 1000)},v1=invalid`,
  52 |     },
  53 |     data: {
  54 |       id: `qa-forged-${Date.now()}`,
  55 |       type: 'payment.succeeded',
  56 |       status: 'succeeded',
  57 |       sequence: 99,
  58 |       ref: 'fp_79c617bbc42c97872d',
  59 |       merchantPaymentId: 'pay_7fda6491c11ed3865a',
  60 |     },
  61 |   });
  62 |   expect([400, 401, 403]).toContain(response.status());
  63 | 
  64 |   const verified = await request.get(`${ENGINE}/api/automation/payments/pay_7fda6491c11ed3865a`, {
  65 |     headers: { Authorization: AUTOMATION },
  66 |   });
  67 |   expect(verified.status()).toBe(200);
  68 |   expect((await verified.json()).status).toBe('failed');
  69 | });
  70 | 
```