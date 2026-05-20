import './style.css';
import { format as formatSql } from 'sql-formatter';

const jsonInput = document.querySelector('#json-input');
const jsonStatus = document.querySelector('#json-status');
const jsonFormatBtn = document.querySelector('#json-format');
const jsonMinifyBtn = document.querySelector('#json-minify');
const jsonCopyBtn = document.querySelector('#json-copy');
const jsonClearBtn = document.querySelector('#json-clear');

const sqlInput = document.querySelector('#sql-input');
const sqlStatus = document.querySelector('#sql-status');
const sqlFormatBtn = document.querySelector('#sql-format');
const sqlCopyBtn = document.querySelector('#sql-copy');
const sqlClearBtn = document.querySelector('#sql-clear');
const sqlLang = document.querySelector('#sql-lang');

function setStatus(el, text, isError = false) {
  el.textContent = text;
  el.classList.toggle('error', isError);
}

function copyToClipboard(text, statusEl, successText) {
  if (!text.trim()) {
    setStatus(statusEl, 'Nothing to copy', true);
    return;
  }

  navigator.clipboard
    .writeText(text)
    .then(() => setStatus(statusEl, successText))
    .catch(() => setStatus(statusEl, 'Copy failed. Your browser may block clipboard access.', true));
}

jsonFormatBtn.addEventListener('click', () => {
  try {
    const parsed = JSON.parse(jsonInput.value);
    jsonInput.value = JSON.stringify(parsed, null, 2);
    setStatus(jsonStatus, 'Formatted JSON');
  } catch (err) {
    setStatus(jsonStatus, `Invalid JSON: ${err.message}`, true);
  }
});

jsonMinifyBtn.addEventListener('click', () => {
  try {
    const parsed = JSON.parse(jsonInput.value);
    jsonInput.value = JSON.stringify(parsed);
    setStatus(jsonStatus, 'Minified JSON');
  } catch (err) {
    setStatus(jsonStatus, `Invalid JSON: ${err.message}`, true);
  }
});

jsonCopyBtn.addEventListener('click', () => {
  copyToClipboard(jsonInput.value, jsonStatus, 'JSON copied');
});

jsonClearBtn.addEventListener('click', () => {
  jsonInput.value = '';
  setStatus(jsonStatus, 'Cleared');
});

sqlFormatBtn.addEventListener('click', () => {
  try {
    sqlInput.value = formatSql(sqlInput.value, {
      language: sqlLang.value,
      tabWidth: 2,
      keywordCase: 'upper'
    });
    setStatus(sqlStatus, 'Formatted SQL');
  } catch (err) {
    setStatus(sqlStatus, `SQL format error: ${err.message}`, true);
  }
});

sqlCopyBtn.addEventListener('click', () => {
  copyToClipboard(sqlInput.value, sqlStatus, 'SQL copied');
});

sqlClearBtn.addEventListener('click', () => {
  sqlInput.value = '';
  setStatus(sqlStatus, 'Cleared');
});
