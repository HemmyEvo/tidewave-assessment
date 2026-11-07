import { APIRequestContext, expect, request, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const LEADS_URL = 'http://localhost:7081';
const ADMIN = 'Bearer tw_staff_admin_5f2c9a';
const VIEWER = 'Bearer tw_staff_viewer_81d4e0';
const AUTOMATION = 'Bearer tw_automation_3b7e11';

let api: APIRequestContext;

function validLead(overrides: Record<string, unknown> = {}) {
  const suffix = randomUUID().replace(/-/g, '').slice(0, 12);
  return {
    firstName: 'QA',
    lastName: 'Candidate',
    email: `qa-${suffix}@tidewave.test`,
    phone: `+23480${suffix}`,
    city: 'Ibadan',
    experienceYears: 0,
    hoursPerWeek: 5,
    consent: true,
    ...overrides,
  };
}

async function createLead(overrides: Record<string, unknown> = {}) {
  return api.post(`${LEADS_URL}/leads`, { data: validLead(overrides) });
}

test.beforeAll(async () => {
  api = await request.newContext({ extraHTTPHeaders: { 'Content-Type': 'application/json' } });
});

test.afterAll(async () => {
  await api.dispose();
});

test.describe('lead application validation', () => {
  const invalidCases: Array<[string, Record<string, unknown>]> = [
    ['first name is required', { firstName: '' }],
    ['email must be valid', { email: 'not-an-email' }],
    ['phone is required', { phone: '' }],
    ['city is required', { city: '' }],
    ['consent must be true', { consent: false }],
    ['consent is required', { consent: undefined }],
  ];

  for (const [label, invalid] of invalidCases) {
    test(`rejects invalid application: ${label}`, async () => {
      const response = await createLead(invalid);
      expect(response.status()).toBe(422);
    });
  }

  test('TIDE-007: rejects nonnumeric and negative numeric values before writing', async () => {
    for (const invalid of [
      { experienceYears: 'not-a-number' },
      { hoursPerWeek: 'not-a-number' },
      { experienceYears: -1 },
      { hoursPerWeek: -0.5 },
    ]) {
      const response = await createLead(invalid);
      expect(response.status()).toBe(422);
    }
  });

  test('accepts numeric strings for experience and availability', async () => {
    const response = await createLead({ experienceYears: '2', hoursPerWeek: '12' });
    expect(response.status()).toBe(201);
    const created = await response.json();
    expect(created.status).toBe('needs_review');
  });
});

test.describe('lead scoring boundaries', () => {
  const cases = [
    { name: 'score 40 stays not_now', experienceYears: 0, hoursPerWeek: 20, city: 'Ibadan', status: 'not_now' },
    { name: 'score 50 needs review', experienceYears: 1, hoursPerWeek: 10, city: 'Ibadan', status: 'needs_review' },
    { name: 'score 60 needs review', experienceYears: 0, hoursPerWeek: 20, city: 'Lagos', status: 'needs_review' },
    { name: 'score exactly 70 invites screening', experienceYears: 1, hoursPerWeek: 10, city: 'Lagos', status: 'screening_invite' },
    { name: 'score 70 from experience and city invites screening', experienceYears: 3, hoursPerWeek: 0, city: 'Abuja', status: 'screening_invite' },
    { name: 'score 90 invites screening', experienceYears: 3, hoursPerWeek: 10, city: 'Accra', status: 'screening_invite' },
  ];

  for (const scenario of cases) {
    test(`returns expected status when ${scenario.name}`, async () => {
      const response = await createLead({
        experienceYears: scenario.experienceYears,
        hoursPerWeek: scenario.hoursPerWeek,
        city: scenario.city,
      });
      expect(response.status()).toBe(201);
      expect((await response.json()).status).toBe(scenario.status);
    });
  }
});

test('TIDE-004: duplicate detection treats email addresses case-insensitively', async () => {
  const email = `qa-case-${randomUUID()}@tidewave.test`;
  const original = await createLead({ email });
  expect(original.status()).toBe(201);
  const originalLead = await original.json();
  expect(originalLead.status).not.toBe('duplicate');

  const duplicate = await createLead({ email: email.toUpperCase() });
  expect(duplicate.status()).toBe(201);
  const duplicateLead = await duplicate.json();
  expect(duplicateLead.status).toBe('duplicate');
  expect(duplicateLead.duplicateOf).toBe(originalLead.id);
});

test('duplicate phone number links to the existing lead', async () => {
  const phone = `+23480${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  const original = await createLead({ phone });
  const originalLead = await original.json();
  const duplicate = await createLead({ phone });
  const duplicateLead = await duplicate.json();

  expect(duplicateLead.status).toBe('duplicate');
  expect(duplicateLead.duplicateOf).toBe(originalLead.id);
});

test('lead list requires staff credentials', async () => {
  expect((await api.get(`${LEADS_URL}/leads`)).status()).toBe(401);
});

test('viewer can read a paginated lead list', async () => {
  const response = await api.get(`${LEADS_URL}/leads?page=1&pageSize=500`, {
    headers: { Authorization: VIEWER },
  });
  expect(response.status()).toBe(200);
  const page = await response.json();
  expect(page.page).toBe(1);
  expect(page.pageSize).toBe(100);
  expect(Array.isArray(page.items)).toBe(true);
});

test('lead search matches a unique email address', async () => {
  const leadResponse = await createLead();
  const created = await leadResponse.json();
  const detail = await api.get(`${LEADS_URL}/leads/${created.id}`, {
    headers: { Authorization: AUTOMATION },
  });
  const email = (await detail.json()).email as string;
  const search = await api.get(`${LEADS_URL}/leads?search=${encodeURIComponent(email)}`, {
    headers: { Authorization: ADMIN },
  });
  expect(search.status()).toBe(200);
  expect((await search.json()).items.some((item: { email: string }) => item.email === email)).toBe(
    true
  );
});

test('lead detail requires credentials and returns not found for an unknown ID', async () => {
  expect((await api.get(`${LEADS_URL}/leads/not-a-real-lead`)).status()).toBe(401);
  const response = await api.get(`${LEADS_URL}/leads/not-a-real-lead`, {
    headers: { Authorization: ADMIN },
  });
  expect(response.status()).toBe(404);
});

test('TIDE-005: viewer cannot change lead status', async () => {
  const created = await createLead();
  const lead = await created.json();
  const response = await api.patch(`${LEADS_URL}/leads/${lead.id}/status`, {
    headers: { Authorization: VIEWER },
    data: { status: 'needs_review' },
  });
  expect(response.status()).toBe(403);
});

test('TIDE-006: active, hired, and field_ready are not allowed statuses', async () => {
  const created = await createLead();
  const lead = await created.json();
  for (const status of ['active', 'hired', 'field_ready']) {
    const response = await api.patch(`${LEADS_URL}/leads/${lead.id}/status`, {
      headers: { Authorization: ADMIN },
      data: { status },
    });
    expect(response.status()).toBe(422);
  }
});

test('status updates reject unknown values and record valid changes', async () => {
  const created = await createLead();
  const lead = await created.json();
  const invalid = await api.patch(`${LEADS_URL}/leads/${lead.id}/status`, {
    headers: { Authorization: ADMIN },
    data: { status: 'unknown' },
  });
  expect(invalid.status()).toBe(422);

  const valid = await api.patch(`${LEADS_URL}/leads/${lead.id}/status`, {
    headers: { Authorization: ADMIN },
    data: { status: 'needs_review' },
  });
  expect(valid.status()).toBe(200);
  expect((await valid.json()).status).toBe('needs_review');
});

test('activity endpoint rejects missing type and unknown lead', async () => {
  const created = await createLead();
  const lead = await created.json();
  const missingType = await api.post(`${LEADS_URL}/leads/${lead.id}/activity`, {
    headers: { Authorization: AUTOMATION },
    data: {},
  });
  expect(missingType.status()).toBe(422);
  const invalidType = await api.post(`${LEADS_URL}/leads/${lead.id}/activity`, {
    headers: { Authorization: AUTOMATION },
    data: { type: ['not', 'a', 'string'] },
  });
  expect(invalidType.status()).toBe(422);
  const missingLead = await api.post(`${LEADS_URL}/leads/not-a-real-lead/activity`, {
    headers: { Authorization: AUTOMATION },
    data: { type: 'qa_activity' },
  });
  expect(missingLead.status()).toBe(404);
});

test('activity can be created and read in chronological order', async () => {
  const created = await createLead();
  const lead = await created.json();
  const added = await api.post(`${LEADS_URL}/leads/${lead.id}/activity`, {
    headers: { Authorization: AUTOMATION },
    data: { type: 'qa_activity', detail: { source: 'playwright' } },
  });
  expect(added.status()).toBe(201);

  const activities = await api.get(`${LEADS_URL}/leads/${lead.id}/activity`, {
    headers: { Authorization: AUTOMATION },
  });
  expect(activities.status()).toBe(200);
  expect((await activities.json()).some((item: { type: string }) => item.type === 'qa_activity')).toBe(
    true
  );
});

test('template catalog requires staff or automation credentials', async () => {
  expect((await api.get(`${LEADS_URL}/templates`)).status()).toBe(401);
  const response = await api.get(`${LEADS_URL}/templates`, {
    headers: { Authorization: AUTOMATION },
  });
  expect(response.status()).toBe(200);
  expect((await response.json()).some((template: { status: string }) => template.status === 'draft')).toBe(
    true
  );
});

test('TIDE-008: template rendering uses fallbacks and rejects unsafe URL schemes', async () => {
  const response = await api.post(`${LEADS_URL}/templates/street-team-prospect/render`, {
    headers: { Authorization: AUTOMATION },
    data: { variables: { firstName: 'QA', screeningUrl: 'javascript:alert(1)' } },
  });
  expect(response.status()).toBe(200);
  const rendered = await response.json();
  expect(rendered.html).not.toContain('undefined');
  expect(rendered.html).not.toContain('javascript:');
  expect(rendered.html).toContain('Please complete your screening interview booking.');
});

test('template renderer rejects path-like template keys', async () => {
  const response = await api.post(`${LEADS_URL}/templates/${encodeURIComponent('../README')}/render`, {
    headers: { Authorization: AUTOMATION },
    data: { variables: {} },
  });
  expect(response.status()).toBe(404);
});
