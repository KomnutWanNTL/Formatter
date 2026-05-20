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
const compareSwapBtn = document.querySelector('#compare-swap');
const compareClearBothBtn = document.querySelector('#compare-clear-both');
const compareIgnoreSpace = document.querySelector('#compare-ignore-space');
const compareIgnoreCase = document.querySelector('#compare-ignore-case');
const compareHideSame = document.querySelector('#compare-hide-same');

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
function normalizeLine(value, ignoreWhitespace, ignoreCase) {
  let normalized = value;

  if (ignoreWhitespace) {
    normalized = normalized.replace(/\s+/g, ' ').trim();
  }

  if (ignoreCase) {
    normalized = normalized.toLowerCase();
  }

  return normalized;
}

function buildLcsTable(seq1, seq2) {
  const rows = seq1.length;
  const cols = seq2.length;
  const table = Array.from({ length: rows + 1 }, () => Array(cols + 1).fill(0));

  for (let i = 1; i <= rows; i++) {
    for (let j = 1; j <= cols; j++) {
      if (seq1[i - 1] === seq2[j - 1]) {
        table[i][j] = table[i - 1][j - 1] + 1;
      } else {
        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
      }
    }
  }

  return table;
}

function mergeChangeBlocks(operations) {
  const merged = [];
  let idx = 0;

  while (idx < operations.length) {
    const current = operations[idx];

    if (current.type === 'same') {
      merged.push(current);
      idx += 1;
      continue;
    }

    const removedLines = [];
    const addedLines = [];

    while (idx < operations.length && operations[idx].type !== 'same') {
      if (operations[idx].type === 'removed') {
        removedLines.push(operations[idx].left);
      }

      if (operations[idx].type === 'added') {
        addedLines.push(operations[idx].right);
      }

      idx += 1;
    }

    const pairCount = Math.min(removedLines.length, addedLines.length);

    for (let pairIdx = 0; pairIdx < pairCount; pairIdx++) {
      merged.push({
        type: 'modified',
        left: removedLines[pairIdx],
        right: addedLines[pairIdx]
      });
    }

    for (let removeIdx = pairCount; removeIdx < removedLines.length; removeIdx++) {
      merged.push({ type: 'removed', left: removedLines[removeIdx], right: '' });
    }

    for (let addIdx = pairCount; addIdx < addedLines.length; addIdx++) {
      merged.push({ type: 'added', left: '', right: addedLines[addIdx] });
    }
  }

  return merged;
}

function computeLineDiff(lines1, lines2, options) {
  const normalized1 = lines1.map((line) => normalizeLine(line, options.ignoreWhitespace, options.ignoreCase));
  const normalized2 = lines2.map((line) => normalizeLine(line, options.ignoreWhitespace, options.ignoreCase));
  const table = buildLcsTable(normalized1, normalized2);
  const operations = [];

  let i = normalized1.length;
  let j = normalized2.length;

  while (i > 0 && j > 0) {
    if (normalized1[i - 1] === normalized2[j - 1]) {
      operations.push({ type: 'same', left: lines1[i - 1], right: lines2[j - 1] });
      i -= 1;
      j -= 1;
    } else if (table[i - 1][j] >= table[i][j - 1]) {
      operations.push({ type: 'removed', left: lines1[i - 1], right: '' });
      i -= 1;
    } else {
      operations.push({ type: 'added', left: '', right: lines2[j - 1] });
      j -= 1;
    }
  }

  while (i > 0) {
    operations.push({ type: 'removed', left: lines1[i - 1], right: '' });
    i -= 1;
  }

  while (j > 0) {
    operations.push({ type: 'added', left: '', right: lines2[j - 1] });
    j -= 1;
  }

  operations.reverse();

  return mergeChangeBlocks(operations);
}

function tokenizeWords(line) {
  const tokens = line.match(/\s+|[^\s\w]+|\w+/g);
  return tokens || [];
}

function buildInlineDiff(leftLine, rightLine, options) {
  const leftTokens = tokenizeWords(leftLine);
  const rightTokens = tokenizeWords(rightLine);
  const norm = (token) => normalizeLine(token, options.ignoreWhitespace, options.ignoreCase);
  const normLeft = leftTokens.map(norm);
  const normRight = rightTokens.map(norm);
  const table = buildLcsTable(normLeft, normRight);

  let i = normLeft.length;
  let j = normRight.length;
  const leftHtml = [];
  const rightHtml = [];

  while (i > 0 && j > 0) {
    if (normLeft[i - 1] === normRight[j - 1]) {
      leftHtml.push(escapeHtml(leftTokens[i - 1]));
      rightHtml.push(escapeHtml(rightTokens[j - 1]));
      i -= 1;
      j -= 1;
    } else if (table[i - 1][j] >= table[i][j - 1]) {
      leftHtml.push(`<span class="word-removed">${escapeHtml(leftTokens[i - 1])}</span>`);
      i -= 1;
    } else {
      rightHtml.push(`<span class="word-added">${escapeHtml(rightTokens[j - 1])}</span>`);
      j -= 1;
    }
  }

  while (i > 0) {
    leftHtml.push(`<span class="word-removed">${escapeHtml(leftTokens[i - 1])}</span>`);
    i -= 1;
  }

  while (j > 0) {
    rightHtml.push(`<span class="word-added">${escapeHtml(rightTokens[j - 1])}</span>`);
    j -= 1;
  }

  return {
    leftHtml: leftHtml.reverse().join('') || '&nbsp;',
    rightHtml: rightHtml.reverse().join('') || '&nbsp;'
  };
}

function renderCell(lineNo, html, side, rowType) {
  const safeLineNo = lineNo === '' ? '&nbsp;' : lineNo;
  const safeContent = html || '&nbsp;';
  return `
    <div class="diff-cell ${side} ${rowType}">
      <span class="line-no">${safeLineNo}</span>
      <span class="line-content">${safeContent}</span>
    </div>
  `;
}

function renderCompare() {
  const text1 = compareLeft.value;
  const text2 = compareRight.value;

  if (!text1 && !text2) {
    compareOutput.innerHTML = '<p class="empty">Paste text in both sides to compare.</p>';
    compareStatusLeft.textContent = 'Ready to compare';
    return;
  }

  const options = {
    ignoreWhitespace: compareIgnoreSpace.checked,
    ignoreCase: compareIgnoreCase.checked,
    hideUnchanged: compareHideSame.checked
  };

  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');
  const diffs = computeLineDiff(lines1, lines2, options);

  let leftLineNo = 1;
  let rightLineNo = 1;
  let sameCount = 0;
  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;

  const rows = [];

  diffs.forEach((entry) => {
    if (entry.type === 'same') {
      const row = `
        <div class="diff-row row-same">
          ${renderCell(leftLineNo, escapeHtml(entry.left), 'left', 'same')}
          ${renderCell(rightLineNo, escapeHtml(entry.right), 'right', 'same')}
        </div>
      `;

      sameCount += 1;
      leftLineNo += 1;
      rightLineNo += 1;

      if (!options.hideUnchanged) {
        rows.push(row);
      }

      return;
    }

    if (entry.type === 'removed') {
      rows.push(`
        <div class="diff-row row-removed">
          ${renderCell(leftLineNo, escapeHtml(entry.left), 'left', 'removed')}
          ${renderCell('', '&nbsp;', 'right', 'removed')}
        </div>
      `);
      removedCount += 1;
      leftLineNo += 1;
      return;
    }

    if (entry.type === 'added') {
      rows.push(`
        <div class="diff-row row-added">
          ${renderCell('', '&nbsp;', 'left', 'added')}
          ${renderCell(rightLineNo, escapeHtml(entry.right), 'right', 'added')}
        </div>
      `);
      addedCount += 1;
      rightLineNo += 1;
      return;
    }

    const inlineDiff = buildInlineDiff(entry.left, entry.right, options);
    rows.push(`
      <div class="diff-row row-modified">
        ${renderCell(leftLineNo, inlineDiff.leftHtml, 'left', 'modified')}
        ${renderCell(rightLineNo, inlineDiff.rightHtml, 'right', 'modified')}
      </div>
    `);
    modifiedCount += 1;
    leftLineNo += 1;
    rightLineNo += 1;
  });

  const diffHtml = `
    <div class="diff-grid">
      <div class="diff-head">
        <span>Original</span>
        <span>Updated</span>
      </div>
      ${rows.join('') || '<p class="empty">No visible differences with current filters.</p>'}
    </div>
  `;

  compareOutput.innerHTML = diffHtml;
  compareStatusLeft.textContent = `${modifiedCount} modified, ${addedCount} added, ${removedCount} removed, ${sameCount} same`;
}

let compareDebounceId;
function scheduleCompareRender() {
  window.clearTimeout(compareDebounceId);
  compareDebounceId = window.setTimeout(renderCompare, 80);
}

compareLeft.addEventListener('input', scheduleCompareRender);
compareRight.addEventListener('input', scheduleCompareRender);
compareIgnoreSpace.addEventListener('change', renderCompare);
compareIgnoreCase.addEventListener('change', renderCompare);
compareHideSame.addEventListener('change', renderCompare);

compareClearLeft.addEventListener('click', () => {
  compareLeft.value = '';
  renderCompare();
});

compareClearRight.addEventListener('click', () => {
  compareRight.value = '';
  renderCompare();
});

compareClearBothBtn.addEventListener('click', () => {
  compareLeft.value = '';
  compareRight.value = '';
  renderCompare();
});

compareSwapBtn.addEventListener('click', () => {
  const leftText = compareLeft.value;
  compareLeft.value = compareRight.value;
  compareRight.value = leftText;
  renderCompare();
});

renderFormattedJson();
renderFormattedSql();
renderCompare();
