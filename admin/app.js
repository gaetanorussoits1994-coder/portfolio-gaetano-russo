(function () {
  'use strict';

  const tools = window.adminTools;
  const backend = window.portfolioBackend;
  let client = null;
  let clientInitialisationError = null;
  try { client = backend?.getClient() || null; } catch (error) { clientInitialisationError = error; }
  const authLoading = document.querySelector('[data-auth-loading]');
  const authView = document.querySelector('[data-auth-view]');
  const adminApp = document.querySelector('[data-admin-app]');
  const loginForm = document.querySelector('[data-login-form]');
  const recoveryForm = document.querySelector('[data-recovery-form]');
  const authMessage = document.querySelector('[data-auth-message]');
  const globalMessage = document.querySelector('[data-global-message]');
  const contentForm = document.querySelector('[data-content-form]');
  const mediaForm = document.querySelector('[data-media-form]');
  const contentList = document.querySelector('[data-content-list]');
  const mediaList = document.querySelector('[data-media-list]');
  const previewDialog = document.querySelector('[data-preview-dialog]');
  const confirmDialog = document.querySelector('[data-confirm-dialog]');
  const AUTH_TIMEOUT_MS = 8000;
  const state = { user: null, items: [], media: [], settings: [], currentType: 'hero', qrSvg: '', uploadUrl: '', locale: 'it' };
  const labels = {
    hero: 'Hero', profile: 'Profilo', infrastructure_case: 'Case study', web_project: 'Progetti tecnici',
    skill: 'Competenze', technical_lab: 'Technical Lab', experience: 'Esperienze', certificate: 'Attestati',
    contact_link: 'Collegamenti di contatto', contact_copy: 'Contatti', seo: 'SEO e impostazioni', section: 'Sezioni'
  };

  try { state.locale = localStorage.getItem('admin-locale') === 'en' ? 'en' : 'it'; } catch (error) { /* Optional preference. */ }

  function reportError(context, error) {
    console.error(`[Portfolio Admin] ${context}`, error);
  }

  function withTimeout(promise, context, timeout = AUTH_TIMEOUT_MS) {
    let timer;
    const deadline = new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error(`${context} timeout dopo ${timeout} ms`)), timeout);
    });
    return Promise.race([Promise.resolve(promise), deadline]).finally(() => clearTimeout(timer));
  }

  function finishLoading() {
    clearTimeout(window.__adminBootTimeout);
    authLoading.hidden = true;
  }

  function showConfigurationRequired() {
    finishLoading();
    adminApp.hidden = true;
    authView.hidden = false;
    document.querySelector('[data-config-warning]').hidden = false;
    loginForm.hidden = true;
    recoveryForm.hidden = true;
    tools.setMessage(authMessage, '');
  }

  function showConnectionProblem() {
    showAuth('Servizio amministrativo temporaneamente non raggiungibile. Controlla la connessione e riprova.');
  }

  function showAuth(message = '') {
    finishLoading();
    adminApp.hidden = true;
    authView.hidden = false;
    document.querySelector('[data-config-warning]').hidden = true;
    if (loginForm.hidden && recoveryForm.hidden) loginForm.hidden = false;
    tools.setMessage(authMessage, message, message ? 'error' : '');
  }

  function showApp() {
    finishLoading();
    authView.hidden = true;
    adminApp.hidden = false;
    document.querySelectorAll('[data-user-email],[data-account-email]').forEach((element) => { element.textContent = state.user.email || ''; });
  }

  async function confirmAction(title, text) {
    document.querySelector('[data-confirm-title]').textContent = title;
    document.querySelector('[data-confirm-text]').textContent = text;
    confirmDialog.showModal();
    return new Promise((resolve) => {
      const yes = document.querySelector('[data-confirm-yes]');
      const no = document.querySelector('[data-confirm-no]');
      const finish = (result) => {
        yes.removeEventListener('click', accept);
        no.removeEventListener('click', reject);
        confirmDialog.removeEventListener('cancel', cancel);
        if (confirmDialog.open) confirmDialog.close();
        resolve(result);
      };
      const accept = () => finish(true);
      const reject = () => finish(false);
      const cancel = (event) => { event.preventDefault(); finish(false); };
      yes.addEventListener('click', accept);
      no.addEventListener('click', reject);
      confirmDialog.addEventListener('cancel', cancel);
    });
  }

  function notify(message, kind = 'success') {
    tools.setMessage(globalMessage, message, kind);
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => tools.setMessage(globalMessage, ''), 5000);
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('site-theme', theme); } catch (error) { /* Optional preference. */ }
  }

  async function verifyAuthorization(user) {
    const { data, error } = await withTimeout(
      client.from('admin_users').select('user_id,is_active').eq('user_id', user.id).maybeSingle(),
      'Verifica autorizzazione'
    );
    if (error) throw error;
    if (!data?.is_active) {
      try { await withTimeout(client.auth.signOut(), 'Logout account non autorizzato'); } catch (signOutError) { reportError('Logout account non autorizzato', signOutError); }
      showAuth('Account autenticato ma non autorizzato come amministratore.');
      return false;
    }
    state.user = user;
    showApp();
    await refreshAll();
    return true;
  }

  async function initialiseAuth() {
    try {
      if (!backend?.hasCredentials) return showConfigurationRequired();
      if (clientInitialisationError) throw clientInitialisationError;
      if (!backend?.libraryAvailable || !client) throw new Error('Libreria Supabase locale non disponibile.');
      const { data, error } = await withTimeout(client.auth.getSession(), 'Verifica sessione');
      if (error) throw error;
      if (!data.session) return showAuth();
      await verifyAuthorization(data.session.user);
    } catch (error) {
      reportError('Inizializzazione autenticazione', error);
      showConnectionProblem();
    } finally {
      finishLoading();
    }
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!client) return;
    const formData = new FormData(loginForm);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return tools.setMessage(authMessage, 'Inserisci email e password valide.', 'error');
    const button = loginForm.querySelector('button[type=submit]');
    button.disabled = true;
    tools.setMessage(authMessage, 'Accesso in corso…');
    try {
      const { data, error } = await withTimeout(client.auth.signInWithPassword({ email, password }), 'Accesso');
      if (error || !data.user) {
        if (error) reportError('Accesso rifiutato', error);
        return tools.setMessage(authMessage, 'Credenziali non valide oppure accesso non disponibile.', 'error');
      }
      await verifyAuthorization(data.user);
    } catch (error) {
      reportError('Accesso amministratore', error);
      tools.setMessage(authMessage, 'Servizio di accesso temporaneamente non raggiungibile. Riprova.', 'error');
    } finally { button.disabled = false; }
  });

  recoveryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!client) return;
    const email = String(new FormData(recoveryForm).get('email') || '').trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return tools.setMessage(authMessage, 'Inserisci un indirizzo email valido.', 'error');
    const button = recoveryForm.querySelector('button[type=submit]');
    button.disabled = true;
    const redirectTo = new URL('reset-password.html', location.href).href;
    try {
      const { error } = await withTimeout(client.auth.resetPasswordForEmail(email, { redirectTo }), 'Recupero password');
      if (error) {
        reportError('Recupero password rifiutato', error);
        return tools.setMessage(authMessage, 'Impossibile inviare il link in questo momento. Riprova più tardi.', 'error');
      }
      recoveryForm.reset();
      tools.setMessage(authMessage, 'Se l’account è valido, riceverai un’email con le istruzioni.', 'success');
    } catch (error) {
      reportError('Recupero password', error);
      tools.setMessage(authMessage, 'Servizio di recupero temporaneamente non raggiungibile. Riprova.', 'error');
    } finally { button.disabled = false; }
  });

  document.querySelector('[data-show-recovery]').addEventListener('click', () => { loginForm.hidden = true; recoveryForm.hidden = false; tools.setMessage(authMessage, ''); });
  document.querySelector('[data-show-login]').addEventListener('click', () => { recoveryForm.hidden = true; loginForm.hidden = false; tools.setMessage(authMessage, ''); });
  document.querySelectorAll('[data-logout]').forEach((button) => button.addEventListener('click', async () => {
    if (!await confirmAction('Terminare la sessione?', 'Dovrai effettuare nuovamente l’accesso.')) return;
    try {
      await withTimeout(client.auth.signOut(), 'Logout');
      state.user = null;
      showAuth();
    } catch (error) {
      reportError('Logout', error);
      notify('Impossibile terminare la sessione in questo momento.', 'error');
    }
  }));

  async function loadItems() {
    const { data, error } = await client.from('content_items').select('*').order('content_type').order('sort_order');
    if (error) throw error;
    state.items = data || [];
  }

  async function loadMedia() {
    const { data, error } = await client.from('media_assets').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    state.media = await Promise.all((data || []).map(async (media) => {
      const { data: signed, error: signedError } = await client.storage.from('portfolio-media').createSignedUrl(media.object_path, 1800);
      return { ...media, preview_url: signedError ? '' : signed.signedUrl };
    }));
  }

  async function loadSettings() {
    const { data, error } = await client.from('site_settings').select('*').order('key');
    if (error) throw error;
    state.settings = data || [];
  }

  async function refreshAll() {
    try {
      await Promise.all([loadItems(), loadMedia(), loadSettings()]);
      renderDashboard();
      renderContent();
      renderMedia();
      populateMediaSelect();
      renderSettings();
    } catch (error) {
      reportError('Caricamento dati amministrativi', error);
      notify('Impossibile caricare i dati. Verifica migrazioni e policy RLS.', 'error');
    }
  }

  function itemTitle(item) { return state.locale === 'en' ? (item.title_en || item.title_it || item.slug) : (item.title_it || item.title_en || item.slug); }

  function formatDate(value) { return new Date(value).toLocaleString(state.locale === 'en' ? 'en-GB' : 'it-IT'); }

  function renderDashboard() {
    document.querySelector('[data-count-all]').textContent = state.items.length;
    document.querySelector('[data-count-published]').textContent = state.items.filter((item) => item.status === 'published').length;
    document.querySelector('[data-count-draft]').textContent = state.items.filter((item) => item.status === 'draft').length;
    document.querySelector('[data-count-media]').textContent = state.media.length;
    const recent = [...state.items].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 6);
    const container = document.querySelector('[data-recent-list]');
    container.replaceChildren(...recent.map((item) => {
      const row = tools.make('div', { className: 'activity-row' });
      const copy = tools.make('div');
      copy.append(tools.make('strong', { text: itemTitle(item) }), tools.make('div', { text: labels[item.content_type] || item.content_type }));
      const time = tools.make('time', { text: formatDate(item.updated_at) });
      row.append(copy, time);
      return row;
    }));
  }

  function statusBadge(status) {
    return tools.make('span', { className: `status ${status}`, text: status === 'published' ? 'Pubblicato' : status === 'draft' ? 'Bozza' : 'Nascosto' });
  }

  function actionButton(label, action, id) {
    const button = tools.make('button', { text: label, type: 'button' });
    button.dataset.action = action;
    button.dataset.id = id;
    return button;
  }

  function renderContent() {
    const items = state.items.filter((item) => item.content_type === state.currentType).sort((a, b) => a.sort_order - b.sort_order);
    document.querySelector('[data-content-heading]').textContent = labels[state.currentType] || 'Contenuti';
    contentList.replaceChildren(...items.map((item, index) => {
      const card = tools.make('article', { className: 'content-item' });
      const copy = tools.make('div');
      const meta = tools.make('div', { className: 'item-meta' });
      meta.append(statusBadge(item.status), tools.make('span', { text: `Ordine ${item.sort_order}` }), tools.make('span', { text: item.slug }));
      copy.append(meta, tools.make('h2', { text: itemTitle(item) }), tools.make('p', { text: `${state.locale === 'en' ? 'Updated' : 'Aggiornato'} ${formatDate(item.updated_at)}` }));
      const actions = tools.make('div', { className: 'item-actions' });
      actions.append(actionButton('Modifica', 'edit', item.id), actionButton('Anteprima', 'preview', item.id));
      if (index > 0) actions.append(actionButton('↑', 'up', item.id));
      if (index < items.length - 1) actions.append(actionButton('↓', 'down', item.id));
      actions.append(actionButton(item.status === 'published' ? 'Nascondi' : 'Pubblica', 'toggle', item.id), actionButton('Elimina', 'delete', item.id));
      card.append(copy, actions);
      return card;
    }));
    if (!items.length) contentList.append(tools.make('p', { text: 'Nessun contenuto in questa sezione.' }));
  }

  function populateMediaSelect() {
    const select = contentForm.elements.media_id;
    const current = select.value;
    const first = tools.make('option', { text: 'Nessun media' });
    first.value = '';
    select.replaceChildren(first, ...state.media.map((media) => {
      const option = tools.make('option', { text: media.original_name });
      option.value = media.id;
      return option;
    }));
    select.value = current;
  }

  function resetContentForm() {
    contentForm.reset();
    contentForm.elements.id.value = '';
    contentForm.elements.content_type.value = state.currentType;
    contentForm.elements.data.value = '{}';
    contentForm.elements.sort_order.value = String(Math.max(0, ...state.items.filter((item) => item.content_type === state.currentType).map((item) => item.sort_order)) + 10);
    document.querySelector('[data-editor-title]').textContent = 'Nuovo contenuto';
  }

  function editContent(item) {
    contentForm.hidden = false;
    document.querySelector('[data-editor-title]').textContent = `Modifica: ${item.title_it || item.slug}`;
    ['id','content_type','slug','category','status','sort_order','title_it','title_en','summary_it','summary_en','body_it','body_en'].forEach((field) => { contentForm.elements[field].value = item[field] ?? ''; });
    contentForm.elements.data.value = JSON.stringify(item.data || {}, null, 2);
    contentForm.elements.media_id.value = item.data?.media_id || '';
    contentForm.elements.public_url.value = item.data?.public_url || item.data?.url || '';
    contentForm.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function showPreview(item) {
    document.querySelector('[data-preview-type]').textContent = labels[item.content_type] || item.content_type;
    document.querySelector('[data-preview-title]').textContent = itemTitle(item);
    document.querySelector('[data-preview-summary]').textContent = state.locale === 'en' ? (item.summary_en || item.summary_it || '') : (item.summary_it || item.summary_en || '');
    document.querySelector('[data-preview-body]').textContent = (state.locale === 'en' ? item.body_en : item.body_it) || JSON.stringify(item.data || {}, null, 2);
    previewDialog.showModal();
  }

  async function reorderItem(item, direction) {
    const items = state.items.filter((entry) => entry.content_type === item.content_type).sort((a, b) => a.sort_order - b.sort_order);
    const index = items.findIndex((entry) => entry.id === item.id);
    const other = items[index + direction];
    if (!other) return;
    const firstOrder = item.sort_order;
    const [{ error: firstError }, { error: secondError }] = await Promise.all([
      client.from('content_items').update({ sort_order: other.sort_order }).eq('id', item.id),
      client.from('content_items').update({ sort_order: firstOrder }).eq('id', other.id)
    ]);
    if (firstError || secondError) return notify('Riordino non completato.', 'error');
    await refreshAll();
  }

  contentList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const item = state.items.find((entry) => entry.id === button.dataset.id);
    if (!item) return;
    if (button.dataset.action === 'edit') return editContent(item);
    if (button.dataset.action === 'preview') return showPreview(item);
    if (button.dataset.action === 'up') return reorderItem(item, -1);
    if (button.dataset.action === 'down') return reorderItem(item, 1);
    if (button.dataset.action === 'toggle') {
      const next = item.status === 'published' ? 'hidden' : 'published';
      if (!await confirmAction(next === 'published' ? 'Pubblicare il contenuto?' : 'Nascondere il contenuto?', item.title_it || item.slug)) return;
      const { error } = await client.from('content_items').update({ status: next }).eq('id', item.id);
      if (error) return notify('Stato non aggiornato.', 'error');
      await refreshAll();
      return notify('Stato aggiornato.');
    }
    if (button.dataset.action === 'delete') {
      if (!await confirmAction('Eliminare definitivamente?', 'Questa operazione rimuove il contenuto dal database e non può essere annullata dall’interfaccia.')) return;
      const { error } = await client.from('content_items').delete().eq('id', item.id);
      if (error) return notify('Eliminazione non riuscita.', 'error');
      await refreshAll();
      notify('Contenuto eliminato.');
    }
  });

  contentForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!contentForm.reportValidity()) return;
    try {
      const fields = new FormData(contentForm);
      const slug = tools.safeText(fields.get('slug'), 100);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Lo slug può contenere solo lettere minuscole, numeri e trattini.');
      const data = tools.parseJson(fields.get('data'));
      const publicUrl = String(fields.get('public_url') || '').trim();
      if (publicUrl && !tools.validHttpUrl(publicUrl)) throw new Error('L’URL pubblico non è valido.');
      if (publicUrl) {
        if (state.currentType === 'contact_link') data.url = publicUrl;
        else data.public_url = publicUrl;
      }
      const media = state.media.find((item) => item.id === fields.get('media_id'));
      if (media) {
        data.media_id = media.id;
        delete data.image;
      } else { delete data.media_id; delete data.image; }
      const payload = {
        content_type: state.currentType,
        slug,
        category: tools.safeText(fields.get('category'), 80) || null,
        status: fields.get('status'),
        sort_order: Number(fields.get('sort_order')),
        title_it: tools.safeText(fields.get('title_it'), 180), title_en: tools.safeText(fields.get('title_en'), 180),
        summary_it: tools.safeText(fields.get('summary_it'), 600), summary_en: tools.safeText(fields.get('summary_en'), 600),
        body_it: tools.safeText(fields.get('body_it')), body_en: tools.safeText(fields.get('body_en')), data
      };
      if (payload.status === 'published' && media && media.status !== 'published') throw new Error('Pubblica prima il media associato oppure salva il contenuto come bozza.');
      if (!Number.isInteger(payload.sort_order) || payload.sort_order < -10000 || payload.sort_order > 10000) throw new Error('Ordine numerico non valido.');
      if (payload.status === 'published' && !await confirmAction('Pubblicare questo contenuto?', 'Sarà leggibile dalla pagina pubblica dopo il salvataggio.')) return;
      const id = String(fields.get('id') || '');
      const query = id ? client.from('content_items').update(payload).eq('id', id) : client.from('content_items').insert(payload);
      const { error } = await query;
      if (error) throw error;
      contentForm.hidden = true;
      resetContentForm();
      await refreshAll();
      notify('Contenuto salvato.');
    } catch (error) {
      reportError('Salvataggio contenuto', error);
      notify(error.message.includes('duplicate') ? 'Slug già utilizzato in questa sezione.' : error.message, 'error');
    }
  });

  document.querySelector('[data-new-content]').addEventListener('click', () => { resetContentForm(); contentForm.hidden = false; contentForm.elements.slug.focus(); });
  document.querySelectorAll('[data-cancel-edit]').forEach((button) => button.addEventListener('click', () => { contentForm.hidden = true; resetContentForm(); }));
  document.querySelector('[data-preview-form]').addEventListener('click', () => {
    try {
      const fields = new FormData(contentForm);
      showPreview({ content_type: state.currentType, slug: fields.get('slug'), title_it: tools.safeText(fields.get('title_it'), 180), summary_it: tools.safeText(fields.get('summary_it'), 600), body_it: tools.safeText(fields.get('body_it')), data: tools.parseJson(fields.get('data')) });
    } catch (error) { reportError('Anteprima contenuto', error); notify(error.message, 'error'); }
  });

  function bytes(size) {
    if (size < 1024) return `${size} B`;
    if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1048576).toFixed(1)} MB`;
  }

  function publicMediaUrl(media) { return media.preview_url || ''; }

  function renderMedia() {
    mediaList.replaceChildren(...state.media.map((media) => {
      const card = tools.make('article', { className: 'media-card' });
      const preview = tools.make('div', { className: 'media-card-preview' });
      if (media.mime_type.startsWith('image/')) {
        const image = tools.make('img'); image.src = publicMediaUrl(media); image.alt = media.alt_it; image.loading = 'lazy'; preview.append(image);
      } else preview.append(tools.make('strong', { text: 'PDF' }));
      const body = tools.make('div', { className: 'media-card-body' });
      body.append(statusBadge(media.status), tools.make('h2', { text: media.original_name }), tools.make('p', { text: `${media.mime_type} · ${bytes(media.size_bytes)}` }));
      const actions = tools.make('div', { className: 'item-actions' });
      actions.append(actionButton('Modifica / sostituisci', 'replace-media', media.id), actionButton('Elimina', 'delete-media', media.id));
      body.append(actions); card.append(preview, body); return card;
    }));
    if (!state.media.length) mediaList.append(tools.make('p', { text: 'Nessun media caricato.' }));
  }

  mediaForm.elements.file.addEventListener('change', () => {
    const file = mediaForm.elements.file.files[0];
    const preview = document.querySelector('[data-upload-preview]');
    preview.replaceChildren();
    if (!file) return preview.append(tools.make('span', { text: 'Nessun file selezionato' }));
    if (state.uploadUrl) URL.revokeObjectURL(state.uploadUrl);
    state.uploadUrl = URL.createObjectURL(file);
    if (file.type.startsWith('image/')) { const image = tools.make('img'); image.src = state.uploadUrl; image.alt = 'Anteprima locale'; preview.append(image); }
    else preview.append(tools.make('strong', { text: `${file.name} · ${bytes(file.size)}` }));
  });

  function resetMediaForm() {
    mediaForm.reset();
    mediaForm.elements.id.value = '';
    mediaForm.elements.existing_path.value = '';
    mediaForm.elements.file.required = true;
    document.querySelector('[data-cancel-media]').hidden = true;
    document.querySelector('[data-upload-preview]').replaceChildren(tools.make('span', { text: 'Nessun file selezionato' }));
    if (state.uploadUrl) URL.revokeObjectURL(state.uploadUrl);
    state.uploadUrl = '';
  }

  mediaList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const media = state.media.find((item) => item.id === button.dataset.id);
    if (!media) return;
    if (button.dataset.action === 'replace-media') {
      mediaForm.elements.id.value = media.id;
      mediaForm.elements.existing_path.value = media.object_path;
      mediaForm.elements.alt_it.value = media.alt_it;
      mediaForm.elements.alt_en.value = media.alt_en;
      mediaForm.elements.status.value = media.status;
      mediaForm.elements.file.required = false;
      document.querySelector('[data-cancel-media]').hidden = false;
      mediaForm.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (button.dataset.action === 'delete-media') {
      if (!await confirmAction('Eliminare il file?', 'Il file e i relativi metadati verranno rimossi. Verifica prima che non sia associato a contenuti pubblicati.')) return;
      const used = state.items.some((item) => item.data?.media_id === media.id);
      if (used) return notify('Il file è associato a un contenuto. Rimuovi prima l’associazione.', 'error');
      const { error: storageError } = await client.storage.from('portfolio-media').remove([media.object_path]);
      if (storageError) return notify('File non eliminato dallo Storage.', 'error');
      const { error } = await client.from('media_assets').delete().eq('id', media.id);
      if (error) return notify('Metadati non eliminati.', 'error');
      await refreshAll(); notify('Media eliminato.');
    }
  });

  mediaForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!mediaForm.reportValidity()) return;
    const file = mediaForm.elements.file.files[0];
    const id = mediaForm.elements.id.value;
    const allowed = ['image/jpeg','image/png','image/webp','application/pdf'];
    if (!file && !id) return notify('Seleziona un file.', 'error');
    if (file && !allowed.includes(file.type)) return notify('Formato file non consentito.', 'error');
    if (file && file.size > 8388608) return notify('Il file supera il limite di 8 MB.', 'error');
    if (mediaForm.elements.status.value === 'published' && !await confirmAction('Pubblicare il media?', 'Dopo il salvataggio il file potrà essere usato dalla pagina pubblica tramite URL firmato.')) return;
    try {
      const altIt = tools.safeText(mediaForm.elements.alt_it.value, 300);
      const altEn = tools.safeText(mediaForm.elements.alt_en.value, 300);
      if (altIt.length < 2 || altEn.length < 2) throw new Error('Alt text italiano e inglese sono obbligatori.');
      if (!file && id) {
        const { error } = await client.from('media_assets').update({ alt_it: altIt, alt_en: altEn, status: mediaForm.elements.status.value }).eq('id', id);
        if (error) throw new Error('Metadati non salvati.');
        resetMediaForm(); await refreshAll(); notify('Media aggiornato.'); return;
      }
      const extension = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
      const safeName = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'media';
      const objectPath = `media/${new Date().getFullYear()}/${crypto.randomUUID()}-${safeName}.${extension}`;
      const { error: uploadError } = await client.storage.from('portfolio-media').upload(objectPath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw new Error('Upload non riuscito.');
      const payload = { object_path: objectPath, original_name: file.name, mime_type: file.type, size_bytes: file.size, alt_it: altIt, alt_en: altEn, status: mediaForm.elements.status.value };
      const { error } = id ? await client.from('media_assets').update(payload).eq('id', id) : await client.from('media_assets').insert(payload);
      if (error) { await client.storage.from('portfolio-media').remove([objectPath]); throw new Error('Metadati non salvati.'); }
      const oldPath = mediaForm.elements.existing_path.value;
      if (id && oldPath && oldPath !== objectPath) await client.storage.from('portfolio-media').remove([oldPath]);
      resetMediaForm(); await refreshAll(); notify(id ? 'Media sostituito.' : 'Media caricato.');
    } catch (error) { reportError('Gestione media', error); notify(error.message, 'error'); }
  });
  document.querySelector('[data-cancel-media]').addEventListener('click', resetMediaForm);

  async function generateQr(url) {
    if (!tools.validHttpUrl(url)) throw new Error('Inserisci un URL pubblico HTTP o HTTPS valido.');
    const parsed = new URL(url);
    if (parsed.pathname.toLowerCase().includes('/admin') || [...parsed.searchParams.keys()].some((key) => /token|key|auth|session|code/i.test(key))) throw new Error('Il QR può contenere soltanto l’URL pubblico del portfolio.');
    const qrCode = window.QRCode;
    if (!qrCode?.toCanvas || !qrCode?.toString) throw new Error('Libreria QR locale non disponibile. Ricarica la pagina.');
    const canvas = document.querySelector('[data-qr-canvas]');
    await qrCode.toCanvas(canvas, parsed.href, { width: 1024, margin: 4, color: { dark: '#07111fff', light: '#ffffffff' }, errorCorrectionLevel: 'H' });
    state.qrSvg = await qrCode.toString(parsed.href, { type: 'svg', width: 1024, margin: 4, color: { dark: '#07111fff', light: '#ffffffff' }, errorCorrectionLevel: 'H' });
    document.querySelector('[data-qr-url]').textContent = parsed.href;
  }

  const qrForm = document.querySelector('[data-qr-form]');
  qrForm.elements.url.value = backend?.config.publicSiteUrl || new URL('../', location.href).href;
  qrForm.addEventListener('submit', async (event) => { event.preventDefault(); try { await generateQr(qrForm.elements.url.value); notify('QR Code rigenerato. Verifica la scansione con un dispositivo reale prima della stampa.'); } catch (error) { reportError('Generazione QR Code', error); notify(error.message, 'error'); } });
  function downloadBlob(blob, fileName) { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = fileName; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  document.querySelector('[data-download-png]').addEventListener('click', () => document.querySelector('[data-qr-canvas]').toBlob((blob) => { if (blob) downloadBlob(blob, 'gaetano-russo-portfolio-qr.png'); }, 'image/png'));
  document.querySelector('[data-download-svg]').addEventListener('click', () => { if (state.qrSvg) downloadBlob(new Blob([state.qrSvg], { type: 'image/svg+xml' }), 'gaetano-russo-portfolio-qr.svg'); else notify('Genera prima il QR Code.', 'error'); });

  function settingValue(key, fallback) {
    const setting = state.settings.find((item) => item.key === key);
    return setting ? setting.value : fallback;
  }

  function renderSettings() {
    const form = document.querySelector('[data-settings-form]');
    form.elements.language.value = settingValue('site.language.default', 'it');
    form.elements.theme.value = settingValue('site.theme.default', 'system');
    form.elements.public_url.value = settingValue('site.public_url', '');
    const order = settingValue('sections.order', []);
    form.elements.section_order.value = Array.isArray(order) ? order.join(',') : '';
    if (!backend?.config.publicSiteUrl && form.elements.public_url.value) qrForm.elements.url.value = form.elements.public_url.value;
  }

  document.querySelector('[data-settings-form]').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const publicUrl = String(form.elements.public_url.value || '').trim();
    if (publicUrl && !tools.validHttpUrl(publicUrl)) return notify('URL pubblico non valido.', 'error');
    let order;
    try {
      order = String(form.elements.section_order.value || '').split(',').map((item) => tools.safeText(item, 50)).filter(Boolean);
      if (order.some((item) => !/^[a-z0-9-]+$/.test(item))) throw new Error('Gli slug delle sezioni non sono validi.');
    } catch (error) { return notify(error.message, 'error'); }
    const rows = [
      { key: 'site.language.default', value: form.elements.language.value, is_public: true },
      { key: 'site.theme.default', value: form.elements.theme.value, is_public: true },
      { key: 'site.public_url', value: publicUrl, is_public: true },
      { key: 'sections.order', value: order, is_public: true }
    ];
    const { error } = await client.from('site_settings').upsert(rows, { onConflict: 'key' });
    if (error) { reportError('Salvataggio impostazioni', error); return notify('Impostazioni non salvate.', 'error'); }
    await loadSettings(); renderSettings(); notify('Impostazioni salvate.');
  });

  function openView(view, contentType, trigger) {
    document.querySelectorAll('[data-panel]').forEach((panel) => { panel.hidden = panel.dataset.panel !== view; });
    document.querySelectorAll('[data-view]').forEach((button) => button.classList.toggle('is-active', button === trigger));
    if (view === 'content') { state.currentType = contentType; resetContentForm(); contentForm.hidden = true; renderContent(); }
    if (view === 'qr' && !state.qrSvg) generateQr(qrForm.elements.url.value).catch(() => {});
    document.querySelector('[data-sidebar]').classList.remove('is-open');
    document.querySelector('[data-menu-toggle]').setAttribute('aria-expanded', 'false');
  }

  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => openView(button.dataset.view, button.dataset.contentType, button)));
  document.querySelector('[data-menu-toggle]').addEventListener('click', (event) => { const sidebar = document.querySelector('[data-sidebar]'); const open = sidebar.classList.toggle('is-open'); event.currentTarget.setAttribute('aria-expanded', String(open)); });
  document.querySelector('[data-theme-toggle]').addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  const localeSelect = document.querySelector('[data-admin-locale]');
  localeSelect.value = state.locale;
  localeSelect.addEventListener('change', () => {
    state.locale = localeSelect.value === 'en' ? 'en' : 'it';
    try { localStorage.setItem('admin-locale', state.locale); } catch (error) { /* Optional preference. */ }
    renderDashboard();
    renderContent();
    notify(state.locale === 'en' ? 'Content language: English.' : 'Lingua contenuti: italiano.');
  });
  document.querySelector('[data-refresh]').addEventListener('click', refreshAll);
  document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
  previewDialog.addEventListener('click', (event) => { if (event.target === previewDialog) previewDialog.close(); });

  client?.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') showAuth();
  });
  initialiseAuth();
})();
