(function () {
  'use strict';

  const typeMap = {
    skill: 'skills',
    experience: 'experiences',
    infrastructure_case: 'infrastructureCases',
    web_project: 'webProjects',
    technical_lab: 'labs',
    certificate: 'certifications'
  };

  function rowToPortfolioItem(row, mediaUrls) {
    const item = { ...(row.data || {}) };
    if (item.title === undefined && (row.title_it || row.title_en)) item.title = { it: row.title_it || '', en: row.title_en || row.title_it || '' };
    if (item.summary === undefined && (row.summary_it || row.summary_en)) item.summary = { it: row.summary_it || '', en: row.summary_en || row.summary_it || '' };
    if (item.detail === undefined && (row.body_it || row.body_en)) item.detail = { it: row.body_it || '', en: row.body_en || row.body_it || '' };
    if (item.media_id && mediaUrls.has(item.media_id)) item.image = mediaUrls.get(item.media_id);
    if (row.content_type === 'web_project' && item.public_url && !item.links) {
      item.links = [{ label: { it: 'Visita il sito', en: 'Visit the website' }, href: item.public_url }];
    }
    return item;
  }

  function applyManagedText(rows) {
    rows.forEach((row) => {
      const selector = row.data?.selector;
      if (!selector || typeof selector !== 'string') return;
      const element = document.querySelector(selector);
      if (!element) return;
      const it = row.body_it || row.title_it || '';
      const en = row.body_en || row.title_en || it;
      const current = document.documentElement.lang === 'en' ? en : it;
      if (element instanceof HTMLMetaElement) element.content = current;
      else {
        element.dataset.i18nIt = it;
        element.dataset.i18nEn = en;
        element.textContent = current;
      }
    });
  }

  function applyContactLinks(rows) {
    const container = document.querySelector('.contact-direct');
    if (!container || !rows.length) return;
    const links = rows.map((row) => {
      const href = String(row.data?.url || '');
      if (!/^(https:\/\/|mailto:)/i.test(href)) return null;
      const link = document.createElement('a');
      link.href = href;
      link.textContent = document.documentElement.lang === 'en' ? (row.title_en || row.title_it) : row.title_it;
      if (href.startsWith('https://')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      const mark = document.createElement('span');
      mark.textContent = '↗';
      link.append(' ', mark);
      return link;
    }).filter(Boolean);
    if (links.length) container.replaceChildren(...links);
  }

  function applySections(rows) {
    const main = document.querySelector('main');
    if (!main || !rows.length) return;
    rows.sort((a, b) => a.sort_order - b.sort_order).forEach((row) => {
      const selector = row.data?.selector;
      if (typeof selector !== 'string') return;
      const section = document.querySelector(selector);
      if (!section || section.parentElement !== main) return;
      section.hidden = row.data?.visible === false;
      main.append(section);
    });
  }

  async function loadPublishedContent() {
    const client = window.portfolioBackend?.getClient();
    if (!client) return { source: 'fallback', reason: 'not-configured' };
    try {
      const { data: rows, error } = await client
        .from('content_items')
        .select('content_type,slug,title_it,title_en,summary_it,summary_en,body_it,body_en,data,sort_order')
        .eq('status', 'published')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      if (!Array.isArray(rows) || !rows.length) return { source: 'fallback', reason: 'empty' };

      const { data: mediaRows, error: mediaError } = await client.from('media_assets').select('id,object_path').eq('status', 'published');
      if (mediaError) throw mediaError;
      const signedMedia = await Promise.all((mediaRows || []).map(async (media) => {
        const { data: signed, error: signedError } = await client.storage.from('portfolio-media').createSignedUrl(media.object_path, 3600);
        return [media.id, signedError ? '' : signed.signedUrl];
      }));
      const mediaUrls = new Map(signedMedia.filter(([, url]) => url));

      Object.entries(typeMap).forEach(([contentType, property]) => {
        const matches = rows.filter((row) => row.content_type === contentType);
        if (matches.length) window.PORTFOLIO_DATA[property] = matches.map((row) => rowToPortfolioItem(row, mediaUrls));
      });
      applyManagedText(rows.filter((row) => ['hero', 'profile', 'contact_copy', 'seo'].includes(row.content_type)));
      applyContactLinks(rows.filter((row) => row.content_type === 'contact_link'));
      applySections(rows.filter((row) => row.content_type === 'section'));
      return { source: 'supabase' };
    } catch (error) {
      return { source: 'fallback', reason: 'unavailable' };
    }
  }

  window.PORTFOLIO_READY = loadPublishedContent();
})();
