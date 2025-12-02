const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../templates.csv');

function parseCsv(raw) {
  const rows = [];
  let currentRow = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];

    if (char === '"') {
      const nextChar = raw[i + 1];
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i++; 
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
      if (char === '\r' && raw[i + 1] === '\n') i++;
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

  return rows;
}

function toCsv(rows) {
  return rows.map(row => {
    return row.map(cell => {
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n') || cell.includes('\r')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',');
  }).join('\n');
}

function formatContent(content) {
  if (!content) return content;

  let formatted = content;

  // Normalize line endings
  formatted = formatted.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 1. Ensure blank line after greeting (Hola! -> Hola!\n\n)
  formatted = formatted.replace(/^(Hola.*!)\s*/i, '$1\n\n');

  // 2. Ensure blank line after paragraphs ending in . or :
  // Look for a period or colon followed by a newline (and optional whitespace)
  formatted = formatted.replace(/([.:])\s*\n\s*/g, '$1\n\n');

  // 3. Ensure blank line before signature (Un abrazo, Saludos, etc.)
  // This is a bit heuristic. Let's look for common signature starters at the end of the text.
  const signatures = ['Un abrazo', 'Saludos', 'Sai', 'Atentamente'];
  signatures.forEach(sig => {
    const regex = new RegExp(`\\s*(${sig}.*)$`, 'm'); // m flag for multiline? No, we want to match near end of string usually.
    // Actually, signatures might not be at the very end if there are post-scripts.
    // Let's just look for "Un abrazo" on its own line.
    formatted = formatted.replace(new RegExp(`\\n\\s*(${sig})`, 'g'), '\n\n$1');
  });

  // 4. Collapse multiple blank lines (3 or more newlines -> 2 newlines)
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  // Trim whitespace
  formatted = formatted.trim();

  return formatted;
}

try {
  const raw = fs.readFileSync(csvPath, 'utf8');
  // Remove BOM if present
  const sanitized = raw.replace(/^\uFEFF/, '');
  
  const rows = parseCsv(sanitized);
  
  if (rows.length === 0) {
    console.error("No rows found in CSV");
    process.exit(1);
  }

  const headers = rows[0];
  const contentIdx = headers.findIndex(h => h.trim() === 'contenido');

  if (contentIdx === -1) {
    console.error("Column 'contenido' not found");
    process.exit(1);
  }

  console.log(`Found 'contenido' at index ${contentIdx}`);

  let updatedCount = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length > contentIdx) {
      const original = row[contentIdx];
      const formatted = formatContent(original);
      if (original !== formatted) {
        row[contentIdx] = formatted;
        updatedCount++;
      }
    }
  }

  console.log(`Updated ${updatedCount} templates.`);

  const newCsv = toCsv(rows);
  fs.writeFileSync(csvPath, newCsv, 'utf8');
  console.log("Successfully wrote updated CSV.");

} catch (err) {
  console.error("Error:", err);
  process.exit(1);
}
