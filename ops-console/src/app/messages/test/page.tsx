'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Template } from '@/lib/types';

export default function MessageTestPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.key === selectedKey),
    [templates, selectedKey]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadTemplates() {
      try {
        const response = await fetch('/api/templates', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load templates');
        }
        if (!Array.isArray(data)) {
          throw new Error('The templates service returned an invalid response');
        }

        const approved = data.filter(
          (template: Template) => template.status === 'approved'
        ) as Template[];
        if (!cancelled) {
          setTemplates(approved);
          setSelectedKey(approved[0]?.key || '');
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setNotification({
            type: 'error',
            message: error instanceof Error ? error.message : 'Failed to load templates',
          });
        }
      } finally {
        if (!cancelled) setLoadingTemplates(false);
      }
    }

    void loadTemplates();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedTemplate) {
      setPreviewHtml('');
      setPreviewError(null);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/templates/${encodeURIComponent(selectedTemplate.key)}/render`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ variables, test: false }),
            signal: controller.signal,
          }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Could not render this template');
        }
        setPreviewHtml(data.html);
        setPreviewError(null);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return;
        setPreviewHtml('');
        setPreviewError(error instanceof Error ? error.message : 'Could not render preview');
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [selectedTemplate, variables]);

  const handleSendTest = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotification(null);

    if (!selectedTemplate) {
      setNotification({ type: 'error', message: 'Select an approved template first.' });
      return;
    }

    const missing = selectedTemplate.variables.find(
      (variable) => variable.required && !variables[variable.name]?.trim()
    );
    if (missing) {
      setNotification({
        type: 'error',
        message: `${missing.label} is required.`,
      });
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/messages/test-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateKey: selectedTemplate.key, variables }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send the test email');
      }

      setNotification({
        type: 'success',
        message: 'Test email sent to staff-test@tidewave.test.',
      });
    } catch (error: unknown) {
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error sending test email',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Test Email Template</h1>
      </div>

      <div className="card">
        {notification && (
          <div className={`alert-box alert-${notification.type}`} role="status" aria-live="polite">
            {notification.message}
          </div>
        )}

        <form onSubmit={handleSendTest}>
          <div className="form-group">
            <label htmlFor="template-select">Approved template</label>
            <select
              id="template-select"
              className="select-input"
              value={selectedKey}
              onChange={(event) => {
                setSelectedKey(event.target.value);
                setVariables({});
                setNotification(null);
              }}
              disabled={loadingTemplates || templates.length === 0}
            >
              {templates.map((template) => (
                <option key={template.key} value={template.key}>
                  {template.name}
                </option>
              ))}
            </select>
            {!loadingTemplates && templates.length === 0 && (
              <p role="status">No approved templates are available.</p>
            )}
          </div>

          {selectedTemplate?.variables.map((variable) => (
            <div className="form-group" key={variable.name}>
              <label htmlFor={`variable-${variable.name}`}>
                {variable.label}
                {variable.required ? ' *' : ' (optional)'}
              </label>
              <input
                id={`variable-${variable.name}`}
                className="input-text"
                type="text"
                value={variables[variable.name] || ''}
                placeholder={variable.example}
                required={variable.required}
                onChange={(event) =>
                  setVariables((current) => ({
                    ...current,
                    [variable.name]: event.target.value,
                  }))
                }
              />
            </div>
          ))}

          <div className="form-group">
            <h2>Email preview</h2>
            {previewError ? (
              <div className="alert-box alert-error" role="alert">
                {previewError}
              </div>
            ) : (
              <iframe
                title="Rendered email preview"
                sandbox=""
                srcDoc={previewHtml || '<p>Loading preview...</p>'}
                style={{ width: '100%', minHeight: '480px', border: '1px solid #ccc' }}
              />
            )}
          </div>

          <p>Test messages are sent only to staff-test@tidewave.test.</p>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={sending || loadingTemplates || !selectedTemplate}
          >
            {sending ? 'Sending test email…' : 'Send TEST run'}
          </button>
        </form>
      </div>
    </div>
  );
}
