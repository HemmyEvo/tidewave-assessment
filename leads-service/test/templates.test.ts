import { beforeAll, describe, expect, it } from 'vitest';
import path from 'path';
import { renderTemplate } from '../src/templates';

beforeAll(() => {
  process.env.TEMPLATES_DIR = path.resolve(process.cwd(), '..', 'templates');
});

describe('Template rendering', () => {
  it('uses safe defaults for omitted variables', () => {
    const result = renderTemplate('street-team-prospect', { firstName: 'QA' });

    expect(result).not.toBeNull();
    expect(result?.html).toContain('Please complete your screening interview booking.');
    expect(result?.html).not.toContain('undefined');
    expect(result?.html).toContain(
      'href="mailto:unsubscribe@tidewave.test?subject&#x3D;Unsubscribe"'
    );
  });

  it('falls back from unsafe URL schemes', () => {
    const result = renderTemplate('solace-intro', {
      firstName: '<script>alert(1)</script>',
      campaignUrl: 'javascript:alert(1)',
    });

    expect(result?.html).not.toContain('javascript:');
    expect(result?.html).toContain('http://localhost:7080/campaigns/harmattan-sessions');
    expect(result?.html).toContain('&lt;script&gt;');
  });

  it('does not render a template key as a filesystem path', () => {
    expect(renderTemplate('../README', {})).toBeNull();
  });
});
