(function () {
  'use strict';

  const forbiddenText = /<\/?[a-z][^>]*>|javascript\s*:|data\s*:\s*text\/html|on\w+\s*=/i;
  const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);

  function safeText(value, maxLength = 12000) {
    const text = String(value ?? '').trim();
    if (text.length > maxLength) throw new Error(`Testo troppo lungo: massimo ${maxLength} caratteri.`);
    if (forbiddenText.test(text)) throw new Error('Markup HTML, script o URL pericolosi non sono consentiti.');
    return text;
  }

  function validateStructured(value, depth = 0) {
    if (depth > 8) throw new Error('La struttura JSON è troppo profonda.');
    if (typeof value === 'string') return safeText(value, 2000);
    if (Array.isArray(value)) {
      if (value.length > 100) throw new Error('La struttura JSON contiene troppi elementi.');
      return value.map((item) => validateStructured(item, depth + 1));
    }
    if (value && typeof value === 'object') {
      const output = {};
      Object.entries(value).forEach(([key, item]) => {
        if (forbiddenKeys.has(key)) throw new Error('Chiave JSON non consentita.');
        output[safeText(key, 80)] = validateStructured(item, depth + 1);
      });
      return output;
    }
    return value;
  }

  function parseJson(value) {
    let parsed;
    try { parsed = JSON.parse(value || '{}'); } catch (error) { throw new Error('Il campo dati deve contenere JSON valido.'); }
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('Il campo dati deve essere un oggetto JSON.');
    return validateStructured(parsed);
  }

  function validHttpUrl(value) {
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol);
    } catch (error) { return false; }
  }

  function setMessage(element, message, kind = '') {
    if (!element) return;
    element.textContent = message;
    element.dataset.kind = kind;
  }

  function make(tag, options = {}) {
    const element = document.createElement(tag);
    if (options.className) element.className = options.className;
    if (options.text !== undefined) element.textContent = options.text;
    if (options.type) element.type = options.type;
    return element;
  }

  function initialisePasswordToggles() {
    document.querySelectorAll('[data-password-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const input = button.closest('.password-field')?.querySelector('input');
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        button.textContent = show ? 'Nascondi' : 'Mostra';
        button.setAttribute('aria-label', show ? 'Nascondi password' : 'Mostra password');
        button.setAttribute('aria-pressed', String(show));
      });
    });
  }

  initialisePasswordToggles();
  window.adminTools = Object.freeze({ safeText, validateStructured, parseJson, validHttpUrl, setMessage, make });
})();
