(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.portfolioQrTools = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const FORMATS = new Set(['square', 'portrait', 'landscape']);
  const QUIET_ZONE_MODULES = 4;

  function normalizePublicUrl(value) {
    let url;
    try { url = new URL(String(value || '').trim()); } catch (error) { throw new Error('Inserisci un URL pubblico HTTPS valido.'); }
    const localHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
    if (url.protocol !== 'https:' || localHosts.has(url.hostname.toLowerCase())) throw new Error('L’URL definitivo deve usare HTTPS e non può essere localhost.');
    if (url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) throw new Error('Il QR può contenere soltanto l’origine pubblica del portfolio, senza percorsi, query o frammenti.');
    return url.origin;
  }

  function formatName(value) {
    return FORMATS.has(value) ? value : 'square';
  }

  function cardGeometry(value) {
    const format = formatName(value);
    if (format === 'portrait') return { width: 1080, height: 1920, qr: 720, x: 180, y: 590 };
    if (format === 'landscape') return { width: 1920, height: 1080, qr: 650, x: 1130, y: 220 };
    return { width: 1600, height: 1600, qr: 780, x: 410, y: 470 };
  }

  function cardTextLayout(value) {
    const format = formatName(value);
    if (format === 'landscape') return { logoX: 120, logoY: 170, nameX: 120, nameY: 360, roleY: 430, copyY: 620, urlY: 770 };
    return { logoX: 120, logoY: 150, nameX: 280, nameY: 190, roleY: 250, copyY: format === 'portrait' ? 1450 : 1330, urlY: format === 'portrait' ? 1530 : 1410 };
  }

  function integerRenderSize(moduleCount, maximumSize) {
    if (!Number.isInteger(moduleCount) || moduleCount < 21) throw new Error('Matrice QR non valida.');
    const totalModules = moduleCount + QUIET_ZONE_MODULES * 2;
    const scale = Math.floor(Number(maximumSize) / totalModules);
    if (!Number.isInteger(scale) || scale < 1) throw new Error('Spazio insufficiente per renderizzare il QR.');
    return { scale, size: totalModules * scale, totalModules };
  }

  function responsiveSvg(source) {
    const svg = String(source || '').trim();
    if (!/^<svg\b[^>]*viewBox="0 0 [0-9.]+ [0-9.]+"/i.test(svg)) throw new Error('Il renderer QR non ha prodotto un SVG con viewBox valido.');
    return svg.replace(/^<svg\b([^>]*)>/i, (match, attributes) => {
      const clean = attributes
        .replace(/\s(?:width|height|preserveAspectRatio|role|aria-hidden|focusable)="[^"]*"/gi, '');
      return `<svg${clean} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="true" focusable="false">`;
    });
  }

  function escapeXml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[character]));
  }

  function downloadName(format, extension) {
    const safeExtension = extension === 'svg' ? 'svg' : 'png';
    return `gaetano-russo-portfolio-${formatName(format)}.${safeExtension}`;
  }

  function placeQrSvg(source, geometry) {
    return responsiveSvg(source).replace(/^<svg\b([^>]*)>/i, (match, attributes) => {
      const clean = attributes.replace(/\s(?:x|y|width|height|preserveAspectRatio)="[^"]*"/gi, '');
      return `<svg${clean} x="${geometry.x}" y="${geometry.y}" width="${geometry.qr}" height="${geometry.qr}" preserveAspectRatio="xMidYMid meet">`;
    });
  }

  function buildCardSvg(formatValue, qrSvg, urlValue) {
    const format = formatName(formatValue);
    const url = normalizePublicUrl(urlValue);
    const geometry = cardGeometry(format);
    const text = cardTextLayout(format);
    const qr = placeQrSvg(qrSvg, geometry);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${geometry.width}" height="${geometry.height}" viewBox="0 0 ${geometry.width} ${geometry.height}" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="bg"><stop stop-color="#07111f"/><stop offset="1" stop-color="#12283d"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#bg)"/><rect x="${text.logoX}" y="${text.logoY}" width="120" height="120" rx="22" fill="#e1b765"/><text x="${text.logoX + 60}" y="${text.logoY + 79}" text-anchor="middle" font-family="system-ui" font-size="54" font-weight="800" fill="#07111f">GR</text><text x="${text.nameX}" y="${text.nameY}" font-family="system-ui" font-size="62" font-weight="800" fill="#edf3f6">Gaetano Russo</text><text x="${text.nameX}" y="${text.roleY}" font-family="system-ui" font-size="34" font-weight="600" fill="#e1b765">IT Specialist</text><rect x="${geometry.x - 36}" y="${geometry.y - 36}" width="${geometry.qr + 72}" height="${geometry.qr + 72}" rx="28" fill="#fff"/>${qr}<text x="${text.logoX}" y="${text.copyY}" font-family="system-ui" font-size="34" font-weight="600" fill="#edf3f6">Scansiona per visitare il mio portfolio</text><text x="${text.logoX}" y="${text.urlY}" font-family="system-ui" font-size="26" fill="#9eacb7">${escapeXml(url)}</text></svg>`;
  }

  return Object.freeze({ QUIET_ZONE_MODULES, normalizePublicUrl, formatName, cardGeometry, cardTextLayout, integerRenderSize, responsiveSvg, escapeXml, downloadName, buildCardSvg });
});
