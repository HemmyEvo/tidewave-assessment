import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { config } from './config';

export interface TemplateVariable {
  name: string;
  label: string;
  required: boolean;
  example: string;
}

export interface TemplateMetadata {
  key?: string;
  name: string;
  audience: 'street-team' | 'solace-avenue';
  status: 'approved' | 'draft';
  subject: string;
  variables: TemplateVariable[];
}

export interface TemplateItem extends TemplateMetadata {
  key: string;
}

export interface RenderResult {
  subject: string;
  html: string;
  text: string;
}

function safeTemplateUrl(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    return fallback;
  }

  const candidate = value.trim();
  try {
    const parsed = new URL(candidate, 'https://tidewave.test');
    if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return candidate;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export function listTemplates(): TemplateItem[] {
  const dir = process.env.TEMPLATES_DIR || config.templatesDir;
  if (!fs.existsSync(dir)) {
    return [];
  }

  try {
    const files = fs.readdirSync(dir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));
    const templates: TemplateItem[] = [];

    for (const jsonFile of jsonFiles) {
      const key = path.basename(jsonFile, '.json');
      const htmlFile = `${key}.html`;

      if (files.includes(htmlFile)) {
        try {
          const jsonContent = fs.readFileSync(path.join(dir, jsonFile), 'utf-8');
          const meta = JSON.parse(jsonContent) as TemplateMetadata;
          templates.push({
            key,
            name: meta.name || key,
            audience: meta.audience || 'street-team',
            status: meta.status || 'draft',
            subject: meta.subject || '',
            variables: meta.variables || [],
          });
        } catch {
          // ignore corrupted individual template
        }
      }
    }

    return templates;
  } catch (err) {
    console.warn(`[Templates] Error reading templates directory: ${(err as Error).message}`);
    return [];
  }
}

export function renderTemplate(
  key: string,
  variables: Record<string, any> = {},
  isTest: boolean = false
): RenderResult | null {
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(key)) {
    return null;
  }

  const dir = process.env.TEMPLATES_DIR || config.templatesDir;
  const jsonPath = path.join(dir, `${key}.json`);
  const htmlPath = path.join(dir, `${key}.html`);

  if (!fs.existsSync(jsonPath) || !fs.existsSync(htmlPath)) {
    return null;
  }

  const metaRaw = fs.readFileSync(jsonPath, 'utf-8');
  const meta: TemplateMetadata = JSON.parse(metaRaw);
  const htmlRaw = fs.readFileSync(htmlPath, 'utf-8');

  const renderContext: Record<string, any> = {};
  if (meta.variables && Array.isArray(meta.variables)) {
    for (const v of meta.variables) {
      const provided = variables?.[v.name];
      const fallback = v.name === 'firstName' ? 'there' : v.example || '';
      const value = provided === undefined || provided === null || provided === '' ? fallback : provided;
      renderContext[v.name] = v.name.toLowerCase().endsWith('url')
        ? safeTemplateUrl(value, fallback)
        : value;
    }
  }

  // Also include any extra user variables
  for (const [k, v] of Object.entries(variables || {})) {
    if (renderContext[k] === undefined) {
      renderContext[k] = v;
    }
  }

  const subjectTemplate = handlebars.compile(meta.subject || '');
  const htmlTemplate = handlebars.compile(htmlRaw);

  let subject = subjectTemplate(renderContext);
  if (isTest) {
    subject = `[TEST] ${subject}`;
  }

  const html = htmlTemplate(renderContext);
  // Plain text fallback by stripping html tags
  const text = html.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();

  return {
    subject,
    html,
    text,
  };
}
