import './style.css';

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

const modeButtons = document.querySelectorAll('.mode-btn');
const jsonSection = document.querySelector('#json-section');
const compareSection = document.querySelector('#compare-section');
const pageTitle = document.querySelector('#page-title');
const pageSubtitle = document.querySelector('#page-subtitle');

let formattedOutput = '';

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

function copyToClipboard(text, successText) {
  if (!text.trim()) {
    setStatus(jsonStatus, 'Nothing to copy', true);
    return;
  }

  navigator.clipboard
    .writeText(text)
    .then(() => setStatus(jsonStatus, successText))
    .catch(() => setStatus(jsonStatus, 'Copy failed. Your browser may block clipboard access.', true));
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
  copyToClipboard(formattedOutput, 'Formatted JSON copied');
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

// ==================== MODE SWITCHING ====================
function setMode(mode) {
  modeButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  if (mode === 'json') {
    jsonSection.style.display = '';
    compareSection.style.display = 'none';
    pageTitle.textContent = 'JSON Formatter';
    pageSubtitle.textContent = 'Auto-format and browse JSON with collapsible objects.';
  } else if (mode === 'compare') {
    jsonSection.style.display = 'none';
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
