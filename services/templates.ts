import templatesCsv from '../templates.csv?raw';

export interface TemplateRecord {
  template_key: string;
  descripcion: string;
  contenido: string;
  pdf_url?: string;
  descripcion_old?: string;
}

// Simple CSV parser that respects quoted fields and new lines inside quotes.
const parseCsvRows = (raw: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];

    if (char === '"') {
      const nextChar = raw[i + 1];
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      // handle CRLF
      if (char === '\r' && raw[i + 1] === '\n') {
        i++;
      }
      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = '';
      continue;
    }

    currentValue += char;
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return rows.filter(row => row.length > 0);
};

const collapseSpaces = (value?: string) =>
  (value || '').replace(/\s+/g, ' ').trim();

const parseTemplates = (raw: string): TemplateRecord[] => {
  const sanitized = raw.replace(/\uFEFF/g, '');
  const rows = parseCsvRows(sanitized);
  if (!rows.length) return [];

  const headers = rows.shift() || [];
  const normalizedHeaders = headers.map(h => h.trim());

  return rows
    .map(row => {
      const record: Record<string, string> = {};
      row.forEach((cell, idx) => {
        const key = normalizedHeaders[idx];
        if (key) record[key] = cell;
      });

      return {
        template_key: collapseSpaces(record['template_key']),
        descripcion: record['descripcion'] || '',
        contenido: record['contenido'] || '',
        pdf_url: record['pdf_url'] || '',
        descripcion_old: record['descripcion_old'] || '',
      } as TemplateRecord;
    })
    .filter(entry => entry.template_key);
};

export const TEMPLATES: TemplateRecord[] = parseTemplates(templatesCsv);
export const TEMPLATE_KEYS = TEMPLATES.map(t => t.template_key);
export const TEMPLATE_SUMMARY = TEMPLATES.map(
  t => `- ${t.template_key}: ${collapseSpaces(t.descripcion)}`,
).join('\n');

export const findTemplateByKey = (key: string) =>
  TEMPLATES.find(t => t.template_key.toLowerCase() === key.toLowerCase());
