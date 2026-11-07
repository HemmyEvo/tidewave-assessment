import { NextRequest, NextResponse } from 'next/server';
import { getStaffRole, getStaffToken } from '@/lib/serverAuth';

export async function POST(request: NextRequest) {
  const role = await getStaffRole();
  if (!role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = await getStaffToken();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const leadsUrl = process.env.LEADS_URL || 'http://localhost:7081';
  const n8nUrl =
    process.env.N8N_TEST_RUN_URL || 'http://localhost:7678/webhook/staff-test-run';

  try {
    const body = await request.json();
    if (
      typeof body.templateKey !== 'string' ||
      !body.templateKey ||
      !body.variables ||
      typeof body.variables !== 'object' ||
      Array.isArray(body.variables)
    ) {
      return NextResponse.json(
        { error: 'A template key and variables object are required' },
        { status: 422 }
      );
    }

    const templatesResponse = await fetch(`${leadsUrl}/templates`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!templatesResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to verify the selected template' },
        { status: 502 }
      );
    }
    const templates = await templatesResponse.json();
    const template = Array.isArray(templates)
      ? templates.find(
          (item) => item.key === body.templateKey && item.status === 'approved'
        )
      : undefined;
    if (!template) {
      return NextResponse.json(
        { error: 'The selected template is not approved or does not exist' },
        { status: 422 }
      );
    }

    const missing = template.variables.find(
      (variable: { name: string; label: string; required: boolean }) =>
        variable.required &&
        (typeof body.variables[variable.name] !== 'string' ||
          !body.variables[variable.name].trim())
    );
    if (missing) {
      return NextResponse.json(
        { error: `${missing.label} is required` },
        { status: 422 }
      );
    }

    const payload = {
      templateKey: body.templateKey,
      variables: body.variables,
      requestedBy: role === 'Admin' ? 'staff.admin' : 'staff.viewer',
    };

    const res = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'Failed to dispatch test run to n8n webhook' },
      { status: 502 }
    );
  }
}
