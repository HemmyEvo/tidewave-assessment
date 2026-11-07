import { expect, test } from '@playwright/test';

const ENGINE = 'http://localhost:7080';
const ADMIN = 'Bearer tw_staff_admin_5f2c9a';
const VIEWER = 'Bearer tw_staff_viewer_81d4e0';
const AUTOMATION = 'Bearer tw_automation_3b7e11';

test('engine API documentation is available', async ({ request }) => {
  const response = await request.get(`${ENGINE}/api/docs`);
  expect(response.status()).toBe(200);
  await expect(response.text()).resolves.toContain('/api/automation/payments/{paymentId}');
});

test('staff payments require credentials', async ({ request }) => {
  expect((await request.get(`${ENGINE}/api/staff/payments`)).status()).toBe(401);
});

test('viewer credentials cannot issue a refund', async ({ request }) => {
  const payments = await request.get(`${ENGINE}/api/staff/payments`, {
    headers: { Authorization: ADMIN },
  });
  const succeeded = (await payments.json()).find((payment: { status: string }) => payment.status === 'succeeded');
  expect(succeeded).toBeTruthy();

  const response = await request.post(`${ENGINE}/api/staff/refunds`, {
    headers: { Authorization: VIEWER },
    data: { paymentId: succeeded.id },
  });
  expect(response.status()).toBe(403);
});

test('automation payment lookup returns provider-verified payment state', async ({ request }) => {
  const staffPayments = await request.get(`${ENGINE}/api/staff/payments`, {
    headers: { Authorization: ADMIN },
  });
  const failed = (await staffPayments.json()).find((payment: { status: string }) => payment.status === 'failed');
  expect(failed).toBeTruthy();

  const response = await request.get(`${ENGINE}/api/automation/payments/${failed.id}`, {
    headers: { Authorization: AUTOMATION },
  });
  expect(response.status()).toBe(200);
  expect((await response.json()).status).toBe('failed');
});

test('invalid FakePay webhook signature cannot confirm a payment', async ({ request }) => {
  const response = await request.post(`${ENGINE}/webhooks/fakepay`, {
    headers: {
      'Content-Type': 'application/json',
      'FakePay-Signature': `t=${Math.floor(Date.now() / 1000)},v1=invalid`,
    },
    data: {
      id: `qa-forged-${Date.now()}`,
      type: 'payment.succeeded',
      status: 'succeeded',
      sequence: 99,
      ref: 'fp_79c617bbc42c97872d',
      merchantPaymentId: 'pay_7fda6491c11ed3865a',
    },
  });
  expect([400, 401, 403]).toContain(response.status());

  const verified = await request.get(`${ENGINE}/api/automation/payments/pay_7fda6491c11ed3865a`, {
    headers: { Authorization: AUTOMATION },
  });
  expect(verified.status()).toBe(200);
  expect((await verified.json()).status).toBe('failed');
});
