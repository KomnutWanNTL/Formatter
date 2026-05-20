import './style.css';
import { format as formatSql } from 'sql-formatter';

const jsonInput = document.querySelector('#json-input');
const jsonStatus = document.querySelector('#json-status');
const jsonCopyBtn = document.querySelector('#json-copy');
const jsonClearBtn = document.querySelector('#json-clear');
const jsonOutput = document.querySelector('#json-output');
const collapseAllBtn = document.querySelector('#collapse-all');
const expandAllBtn = document.querySelector('#expand-all');

const compareLeft = document.querySelector('#compare-left');
const compareRight = document.querySelector('#compare-right');
const compareOutput = document.querySelector('#compare-output');
const compareStatusLeft = document.querySelector('#compare-status-left');
const compareClearLeft = document.querySelector('#compare-clear-left');
const compareClearRight = document.querySelector('#compare-clear-right');

const sqlInput = document.querySelector('#sql-input');
const sqlOutput = document.querySelector('#sql-output');
const sqlStatus = document.querySelector('#sql-status');
const sqlTemplate = document.querySelector('#sql-template');
const sqlLanguage = document.querySelector('#sql-language');
const sqlClearBtn = document.querySelector('#sql-clear');
const sqlCopyBtn = document.querySelector('#sql-copy');

const modeButtons = document.querySelectorAll('.mode-btn');
const jsonSection = document.querySelector('#json-section');
const sqlSection = document.querySelector('#sql-section');
const compareSection = document.querySelector('#compare-section');
const pageTitle = document.querySelector('#page-title');
const pageSubtitle = document.querySelector('#page-subtitle');

let formattedOutput = '';
let formattedSqlOutput = '';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function setStatus(el, text, isError = false) {
  el.textContent = text;
  el.classList.toggle('error', isError);
}

function copyToClipboard(text, successText, statusEl) {
  if (!text.trim()) {
    setStatus(statusEl, 'Nothing to copy', true);
    return;
  }

  navigator.clipboard
    .writeText(text)
    .then(() => setStatus(statusEl, successText))
    .catch(() => setStatus(statusEl, 'Copy failed. Your browser may block clipboard access.', true));
}

function getSqlTemplateOptions(templateName) {
  switch (templateName) {
    case 'mssql-compact':
      return {
        keywordCase: 'upper',
        tabWidth: 2,
        linesBetweenQueries: 1,
        denseOperators: true,
        expressionWidth: 80
      };
    case 'mssql-reporting':
      return {
        keywordCase: 'upper',
        tabWidth: 4,
        linesBetweenQueries: 2,
        denseOperators: false,
        expressionWidth: 120
      };
    case 'mssql-wide':
      return {
        keywordCase: 'upper',
        tabWidth: 2,
        linesBetweenQueries: 1,
        denseOperators: false,
        expressionWidth: 140
      };
    case 'ansi-clean':
      return {
        keywordCase: 'upper',
        tabWidth: 2,
        linesBetweenQueries: 1,
        denseOperators: false,
        expressionWidth: 100
      };
    case 'mssql-standard':
    default:
      return {
        keywordCase: 'upper',
        tabWidth: 2,
        linesBetweenQueries: 1,
        denseOperators: false,
        expressionWidth: 100
      };
  }
}

function normalizeSqlTerminator(sqlText) {
  let normalized = sqlText.trimEnd();

  // Insert terminators between top-level statements when input has multiple queries without ';'.
  normalized = normalized.replace(
    /([^\s;])\n(?=(SELECT|WITH|INSERT|UPDATE|DELETE|MERGE|CREATE|ALTER|DROP|EXEC|DECLARE)\b)/gm,
    '$1;\n\n'
  );

  // Keep any existing terminators clean and followed by a single line break.
  normalized = normalized.replace(/;[ \t]*(\r?\n)*/g, ';\n');

  // If statement separator was inserted, preserve one blank line between statements.
  normalized = normalized.replace(/;\n(?=(SELECT|WITH|INSERT|UPDATE|DELETE|MERGE|CREATE|ALTER|DROP|EXEC|DECLARE)\b)/gm, ';\n\n');

  return normalized;
}

function primitiveMarkup(value) {
  if (typeof value === 'string') {
    return `<span class="value string">"${escapeHtml(value)}"</span>`;
  }

  if (typeof value === 'number') {
    return `<span class="value number">${value}</span>`;
  }

  if (typeof value === 'boolean') {
    return `<span class="value boolean">${value}</span>`;
  }

  if (value === null) {
    return '<span class="value null">null</span>';
  }

  return `<span class="value">${escapeHtml(value)}</span>`;
}

function renderNode(value, key = null) {
  const keyLabel = key === null ? '' : `<span class="key">${escapeHtml(key)}</span><span class="sep">: </span>`;

  if (Array.isArray(value)) {
    const count = value.length;
    const items = value
      .map((item, index) => `<li>${renderNode(item, index)}</li>`)
      .join('');
    return `
      <details open>
        <summary>${keyLabel}<span class="token">[ ]</span> <span class="hint">${count} item${count === 1 ? '' : 's'}</span></summary>
        <ul class="json-tree">${items}</ul>
      </details>
    `;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    const items = entries
      .map(([childKey, childValue]) => `<li>${renderNode(childValue, childKey)}</li>`)
      .join('');
    return `
      <details open>
        <summary>${keyLabel}<span class="token">{ }</span> <span class="hint">${entries.length} key${entries.length === 1 ? '' : 's'}</span></summary>
        <ul class="json-tree">${items}</ul>
      </details>
    `;
  }

  return `${keyLabel}${primitiveMarkup(value)}`;
}

function renderFormattedJson() {
  const raw = jsonInput.value.trim();

  if (!raw) {
    formattedOutput = '';
    jsonOutput.innerHTML = '<p class="empty">Paste JSON on the left to see formatted output.</p>';
    setStatus(jsonStatus, 'Ready');
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    formattedOutput = JSON.stringify(parsed, null, 2);
    jsonOutput.innerHTML = renderNode(parsed);
    setStatus(jsonStatus, 'Auto-formatted');
  } catch (err) {
    formattedOutput = '';
    jsonOutput.innerHTML = `<p class="empty error-text">Invalid JSON: ${escapeHtml(err.message)}</p>`;
    setStatus(jsonStatus, `Invalid JSON: ${err.message}`, true);
  }
}

let debounceId;
jsonInput.addEventListener('input', () => {
  window.clearTimeout(debounceId);
  debounceId = window.setTimeout(renderFormattedJson, 180);
});

jsonCopyBtn.addEventListener('click', () => {
  copyToClipboard(formattedOutput, 'Formatted JSON copied', jsonStatus);
});

jsonClearBtn.addEventListener('click', () => {
  jsonInput.value = '';
  renderFormattedJson();
  setStatus(jsonStatus, 'Cleared');
});

collapseAllBtn.addEventListener('click', () => {
  jsonOutput.querySelectorAll('details').forEach((node) => {
    node.open = false;
  });
});

expandAllBtn.addEventListener('click', () => {
  jsonOutput.querySelectorAll('details').forEach((node) => {
    node.open = true;
  });
});

// ==================== SQL FORMATTER ====================
function renderFormattedSql() {
  const raw = sqlInput.value.trim();

  if (!raw) {
    formattedSqlOutput = '';
    sqlOutput.textContent = 'Paste SQL on the left to see formatted output.';
    setStatus(sqlStatus, 'Ready');
    return;
  }

  try {
    const selectedTemplate = sqlTemplate.value;
    const selectedLanguage = sqlLanguage.value;
    const options = getSqlTemplateOptions(selectedTemplate);

    formattedSqlOutput = formatSql(raw, {
      language: selectedLanguage,
      ...options
    });

    formattedSqlOutput = normalizeSqlTerminator(formattedSqlOutput);

    sqlOutput.textContent = formattedSqlOutput;
    setStatus(sqlStatus, `Auto-formatted (${selectedTemplate})`);
  } catch (err) {
    formattedSqlOutput = '';
    sqlOutput.textContent = `SQL format error: ${err.message}`;
    setStatus(sqlStatus, `SQL format error: ${err.message}`, true);
  }
}

let sqlDebounceId;
sqlInput.addEventListener('input', () => {
  window.clearTimeout(sqlDebounceId);
  sqlDebounceId = window.setTimeout(renderFormattedSql, 180);
});

sqlTemplate.addEventListener('change', renderFormattedSql);
sqlLanguage.addEventListener('change', renderFormattedSql);

sqlClearBtn.addEventListener('click', () => {
  sqlInput.value = '';
  renderFormattedSql();
  setStatus(sqlStatus, 'Cleared');
});

sqlCopyBtn.addEventListener('click', () => {
  copyToClipboard(formattedSqlOutput, 'Formatted SQL copied', sqlStatus);
});

// ==================== MODE SWITCHING ====================
function setMode(mode) {
  modeButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  if (mode === 'json') {
    jsonSection.style.display = '';
    sqlSection.style.display = 'none';
    compareSection.style.display = 'none';
    pageTitle.textContent = 'JSON Formatter';
    pageSubtitle.textContent = 'Auto-format and browse JSON with collapsible objects.';
  } else if (mode === 'sql') {
    jsonSection.style.display = 'none';
    sqlSection.style.display = '';
    compareSection.style.display = 'none';
    pageTitle.textContent = 'SQL Formatter';
    pageSubtitle.textContent = 'MSSQL-focused SQL formatting with selectable templates and dialects.';
  } else if (mode === 'compare') {
    jsonSection.style.display = 'none';
    sqlSection.style.display = 'none';
    compareSection.style.display = '';
    pageTitle.textContent = 'Text Compare';
    pageSubtitle.textContent = 'Paste two texts to compare and see differences highlighted.';
  }
}

modeButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    setMode(btn.dataset.mode);
  });
});

// ==================== TEXT COMPARE ====================
function computeDiff(lines1, lines2) {
  const maxLen = Math.max(lines1.length, lines2.length);
  const result = [];

  for (let i = 0; i < maxLen; i++) {
    const line1 = lines1[i] || '';
    const line2 = lines2[i] || '';

    if (line1 === line2) {
      result.push({ type: 'same', line1, line2 });
    } else {
      result.push({ type: 'changed', line1, line2 });
    }
  }

  return result;
}

function renderCompare() {
  const text1 = compareLeft.value;
  const text2 = compareRight.value;

  if (!text1 && !text2) {
    compareOutput.innerHTML = '<p class="empty">Paste text on the left to compare.</p>';
    compareStatusLeft.textContent = 'Ready to compare';
    return;
  }

  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');
  const diffs = computeDiff(lines1, lines2);

  const diffHtml = diffs
    .map((diff, idx) => {
      if (diff.type === 'same') {
        return `<div class="diff-line same"><span class="line-no">${idx + 1}</span><span class="line-content">${escapeHtml(diff.line2)}</span></div>`;
      } else {
        return `<div class="diff-line changed"><span class="line-no">${idx + 1}</span><span class="line-content">${escapeHtml(diff.line2)}</span></div>`;
      }
    })
    .join('');

  compareOutput.innerHTML = diffHtml || '<p class="empty">No content to compare.</p>';

  const changedCount = diffs.filter((d) => d.type === 'changed').length;
  compareStatusLeft.textContent = `${changedCount} difference${changedCount === 1 ? '' : 's'}`;
}

let compareDebounceId;
compareLeft.addEventListener('input', () => {
  window.clearTimeout(compareDebounceId);
  compareDebounceId = window.setTimeout(renderCompare, 100);
});

compareRight.addEventListener('input', () => {
  window.clearTimeout(compareDebounceId);
  compareDebounceId = window.setTimeout(renderCompare, 100);
});

compareClearLeft.addEventListener('click', () => {
  compareLeft.value = '';
  renderCompare();
});

compareClearRight.addEventListener('click', () => {
  compareRight.value = '';
  renderCompare();
});

renderFormattedJson();
renderFormattedSql();
