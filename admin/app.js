(function () {
  'use strict';

  const tools = window.adminTools;
  const qrTools = window.portfolioQrTools;
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
  const state = { user: null, items: [], media: [], placements: [], messages: [], replies: [], settings: [], currentType: 'hero', qrSvg: '', qrUrl: '', uploadUrl: '', locale: 'it', contentDraftDirty: false, mediaDraftDirty: false, settingsDraftDirty: false, replyDraftDirty: false };
  const labels = {
    hero: 'Hero', profile: 'Profilo', infrastructure_case: 'Case study', web_project: 'Progetti tecnici',
    skill: 'Competenze', technical_lab: 'Technical Lab', experience: 'Esperienze', certificate: 'Attestati',
    contact_link: 'Collegamenti di contatto', contact_copy: 'Contatti', seo: 'SEO e impostazioni', section: 'Sezioni'
  };

  try { state.locale = localStorage.getItem('admin-locale') === 'en' ? 'en' : 'it'; } catch (error) { /* Optional preference. */ }

  function isDevelopmentEnvironment() {
    return ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  }

  function reportError(phase, error) {
    if (!isDevelopmentEnvironment()) return;
    let hostname = 'configurazione_non_valida';
    try { hostname = new URL(backend?.config?.supabaseUrl || '').hostname; } catch (urlError) { /* Safe diagnostic fallback. */ }
    const httpStatus = typeof error?.status === 'number' ? error.status : null;
    const supabaseCode = typeof error?.code === 'string' ? error.code : (error?.name || 'client_error');
    const message = typeof error?.message === 'string' ? error.message : 'Errore senza messaggio';
    console.error('[Portfolio Admin]', { phase, httpStatus, supabaseCode, message, hostname });
  }

  function isNetworkError(error) {
    return error?.name === 'AuthRetryableFetchError'
      || error?.status === 0
      || /fetch|network|name_not_resolved|failed to connect/i.test(error?.message || '');
  }

  function authenticationMessage(error) {
    if (isNetworkError(error)) return 'Servizio Supabase non raggiungibile. Controlla la connessione e riprova.';
    if (error?.code === 'invalid_credentials') return 'Autenticazione rifiutata: email o password non corrette.';
    if (error?.code === 'email_not_confirmed') return 'L’indirizzo email non risulta confermato.';
    return 'Errore inatteso durante l’autenticazione. Riprova tra poco.';
  }

  async function rejectAuthorization(message) {
    try {
      await withTimeout(client.auth.signOut(), 'Logout dopo autorizzazione negata');
    } catch (error) {
      reportError('logout_autorizzazione', error);
    }
    showAuth(message);
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

  function notify(message, kind = 'success', moveFocus = false) {
    tools.setMessage(globalMessage, message, kind);
    if (moveFocus) {
      globalMessage.setAttribute('tabindex', '-1');
      globalMessage.focus({ preventScroll: false });
    }
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => tools.setMessage(globalMessage, ''), 5000);
  }

  function setFormBusy(form, busy) {
    form.dataset.busy = busy ? 'true' : '';
    const submit = form.querySelector('button[type=submit]');
    if (submit) submit.disabled = busy;
  }

  async function verifyAuthorization(user) {
    const { data, error } = await withTimeout(
      client.from('admin_users').select('user_id,is_active').eq('user_id', user.id).eq('is_active', true).maybeSingle(),
      'Verifica autorizzazione'
    );
    if (error) throw error;
    if (!data?.is_active) {
      await rejectAuthorization('Account autenticato ma non autorizzato come amministratore.');
      return false;
    }
    state.user = user;
    showApp();
    return true;
  }

  async function authorizeAndLoad(user, failureMessage) {
    let authorized;
    try {
      authorized = await verifyAuthorization(user);
    } catch (error) {
      reportError('autorizzazione_admin', error);
      await rejectAuthorization(failureMessage);
      return false;
    }
    if (!authorized) return false;
    try {
      await refreshAll();
    } catch (error) {
      reportError('caricamento_dati_admin', error);
      notify('Accesso autorizzato, ma i dati amministrativi non sono disponibili.', 'error');
    }
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
      await authorizeAndLoad(data.session.user, 'Sessione valida, ma verifica dell’autorizzazione amministrativa non riuscita.');
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
    let result;
    try {
      result = await withTimeout(client.auth.signInWithPassword({ email, password }), 'Autenticazione');
    } catch (error) {
      reportError('autenticazione', error);
      tools.setMessage(authMessage, 'Servizio di accesso temporaneamente non raggiungibile. Riprova.', 'error');
      button.disabled = false;
      return;
    }
    if (result.error || !result.data?.user) {
      const error = result.error || new Error('Supabase Auth non ha restituito un utente.');
      reportError('autenticazione', error);
      tools.setMessage(authMessage, authenticationMessage(error), 'error');
      button.disabled = false;
      return;
    }
    await authorizeAndLoad(
      result.data.user,
      'Autenticazione riuscita, ma verifica dell’autorizzazione amministrativa non riuscita.'
    );
    button.disabled = false;
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
      if (media.external_url) return { ...media, preview_url: media.external_url };
      const { data: signed, error: signedError } = await client.storage.from('portfolio-media').createSignedUrl(media.object_path, 1800);
      return { ...media, preview_url: signedError ? '' : signed.signedUrl };
    }));
  }

  async function loadSettings() {
    const { data, error } = await client.from('site_settings').select('*').order('key');
    if (error) throw error;
    state.settings = data || [];
  }

  async function loadPlacementsAndMessages() {
    const [placementsResult, messagesResult, repliesResult] = await Promise.all([
      client.from('media_placements').select('*').order('sort_order'),
      client.from('contact_messages').select('*').order('created_at', { ascending: false }),
      client.from('message_replies').select('*').order('created_at')
    ]);
    const missingMigration = [placementsResult, messagesResult, repliesResult].find((result) => result.error?.code === '42P01');
    if (missingMigration) {
      state.placements = []; state.messages = []; state.replies = [];
      return;
    }
    if (placementsResult.error) throw placementsResult.error;
    if (messagesResult.error) throw messagesResult.error;
    if (repliesResult.error) throw repliesResult.error;
    state.placements = placementsResult.data || [];
    state.messages = messagesResult.data || [];
    state.replies = repliesResult.data || [];
  }

  async function refreshAll() {
    try {
      await Promise.all([loadItems(), loadMedia(), loadSettings(), loadPlacementsAndMessages()]);
      renderDashboard();
      renderContent();
      fillSelect(document.querySelector('[data-media-section-filter]'), [['', 'Tutte'], ...sectionKeys.map((key) => [key, labels[key]])], document.querySelector('[data-media-section-filter]').value);
      renderMedia();
      populateMediaSelect();
      renderSettings();
      renderSectionMedia();
      renderMessages();
    } catch (error) {
      reportError('Caricamento dati amministrativi', error);
      notify('Impossibile caricare i dati. Verifica migrazioni e policy RLS.', 'error');
    }
  }

  function itemTitle(item) { return state.locale === 'en' ? (item.title_en || item.title_it || item.slug) : (item.title_it || item.title_en || item.slug); }

  function formatDate(value) { return new Date(value).toLocaleString(state.locale === 'en' ? 'en-GB' : 'it-IT', { timeZone: 'Europe/Rome' }); }

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

  function actionButton(label, action, id, ariaLabel = '') {
    const button = tools.make('button', { text: label, type: 'button' });
    button.dataset.action = action;
    button.dataset.id = id;
    if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
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
      if (index > 0) actions.append(actionButton('↑', 'up', item.id, `Sposta ${itemTitle(item)} verso l’alto`));
      if (index < items.length - 1) actions.append(actionButton('↓', 'down', item.id, `Sposta ${itemTitle(item)} verso il basso`));
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
    const posterSelect = mediaForm.elements.poster_media_id;
    const posterCurrent = posterSelect.value;
    const noPoster = tools.make('option', { text: 'Nessun poster' }); noPoster.value = '';
    posterSelect.replaceChildren(noPoster, ...state.media.filter((media) => media.media_type === 'image' || media.mime_type.startsWith('image/')).map((media) => { const option = tools.make('option', { text: media.title_internal || media.original_name }); option.value = media.id; return option; }));
    posterSelect.value = posterCurrent;
  }

  function resetContentForm() {
    contentForm.reset();
    contentForm.elements.id.value = '';
    contentForm.elements.content_type.value = state.currentType;
    contentForm.elements.data.value = '{}';
    contentForm.elements.sort_order.value = String(Math.max(0, ...state.items.filter((item) => item.content_type === state.currentType).map((item) => item.sort_order)) + 10);
    document.querySelector('[data-editor-title]').textContent = 'Nuovo contenuto';
    state.contentDraftDirty = false;
    renderSectionMedia();
  }

  function editContent(item) {
    contentForm.hidden = false;
    document.querySelector('[data-editor-title]').textContent = `Modifica: ${item.title_it || item.slug}`;
    ['id','content_type','slug','category','status','sort_order','title_it','title_en','summary_it','summary_en','body_it','body_en'].forEach((field) => { contentForm.elements[field].value = item[field] ?? ''; });
    contentForm.elements.data.value = JSON.stringify(item.data || {}, null, 2);
    contentForm.elements.media_id.value = item.data?.media_id || '';
    contentForm.elements.public_url.value = item.data?.public_url || item.data?.url || '';
    renderSectionMedia();
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
    if (!contentForm.reportValidity() || contentForm.dataset.busy === 'true') return;
    setFormBusy(contentForm, true);
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
    } finally { setFormBusy(contentForm, false); }
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
    const search = document.querySelector('[data-media-search]').value.trim().toLowerCase();
    const type = document.querySelector('[data-media-type-filter]').value;
    const section = document.querySelector('[data-media-section-filter]').value;
    const filtered = state.media.filter((media) => {
      const haystack = `${media.title_internal || ''} ${media.original_name} ${media.alt_it} ${media.alt_en}`.toLowerCase();
      const sections = state.placements.filter((placement) => placement.media_id === media.id).map((placement) => placement.section_key);
      return (!search || haystack.includes(search)) && (!type || media.media_type === type) && (!section || sections.includes(section));
    });
    mediaList.replaceChildren(...filtered.map((media) => {
      const card = tools.make('article', { className: 'media-card' });
      const preview = tools.make('div', { className: 'media-card-preview' });
      if (media.mime_type.startsWith('image/')) {
        const image = tools.make('img'); image.src = publicMediaUrl(media); image.alt = media.alt_it; image.loading = 'lazy'; preview.append(image);
      } else if (media.mime_type.startsWith('video/')) {
        const video = tools.make('video'); video.src = publicMediaUrl(media); video.muted = true; video.preload = 'metadata'; video.controls = true; preview.append(video);
      } else preview.append(tools.make('strong', { text: 'Documento PDF legacy' }));
      const body = tools.make('div', { className: 'media-card-body' });
      const usage = state.placements.filter((placement) => placement.media_id === media.id).map((placement) => labels[placement.section_key] || placement.section_key);
      body.append(statusBadge(media.status), tools.make('h2', { text: media.title_internal || media.original_name }), tools.make('p', { text: `${media.mime_type} · ${bytes(media.size_bytes)}` }), tools.make('p', { text: usage.length ? `Usato in: ${[...new Set(usage)].join(', ')}` : 'Non assegnato' }));
      const actions = tools.make('div', { className: 'item-actions' });
      actions.append(actionButton('Modifica / sostituisci', 'replace-media', media.id), actionButton('Elimina', 'delete-media', media.id));
      body.append(actions); card.append(preview, body); return card;
    }));
    if (!filtered.length) mediaList.append(tools.make('p', { text: 'Nessun media corrisponde ai filtri.' }));
  }

  mediaForm.elements.file.addEventListener('change', () => {
    const file = mediaForm.elements.file.files[0];
    const preview = document.querySelector('[data-upload-preview]');
    preview.replaceChildren();
    if (!file) return preview.append(tools.make('span', { text: 'Nessun file selezionato' }));
    if (state.uploadUrl) URL.revokeObjectURL(state.uploadUrl);
    state.uploadUrl = URL.createObjectURL(file);
    if (file.type.startsWith('image/')) { const image = tools.make('img'); image.src = state.uploadUrl; image.alt = 'Anteprima locale'; preview.append(image); }
    else if (file.type.startsWith('video/')) { const video = tools.make('video'); video.src = state.uploadUrl; video.muted = true; video.controls = true; preview.append(video); }
    else preview.append(tools.make('strong', { text: `${file.name} · ${bytes(file.size)}` }));
  });

  function resetMediaForm() {
    mediaForm.reset();
    mediaForm.elements.id.value = '';
    mediaForm.elements.existing_path.value = '';
    mediaForm.elements.file.required = false;
    document.querySelector('[data-cancel-media]').hidden = true;
    document.querySelector('[data-upload-preview]').replaceChildren(tools.make('span', { text: 'Nessun file selezionato' }));
    if (state.uploadUrl) URL.revokeObjectURL(state.uploadUrl);
    state.uploadUrl = '';
    state.mediaDraftDirty = false;
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
      mediaForm.elements.title_internal.value = media.title_internal || media.original_name;
      mediaForm.elements.caption.value = media.caption || '';
      mediaForm.elements.external_url.value = media.external_url || '';
      mediaForm.elements.poster_media_id.value = media.poster_media_id || '';
      mediaForm.elements.status.value = media.status;
      mediaForm.elements.file.required = false;
      document.querySelector('[data-cancel-media]').hidden = false;
      mediaForm.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (button.dataset.action === 'delete-media') {
      if (!await confirmAction('Eliminare il file?', 'Il file e i relativi metadati verranno rimossi. Verifica prima che non sia associato a contenuti pubblicati.')) return;
      const usedByItems = state.items.filter((item) => item.data?.media_id === media.id).map((item) => labels[item.content_type]);
      const usedByPlacements = state.placements.filter((item) => item.media_id === media.id).map((item) => labels[item.section_key]);
      const usedAsPoster = state.media.filter((item) => item.poster_media_id === media.id).map((item) => `poster di ${item.title_internal || item.original_name}`);
      const used = [...new Set([...usedByItems, ...usedByPlacements, ...usedAsPoster].filter(Boolean))];
      if (used.length) return notify(`Il file è usato in: ${used.join(', ')}. Rimuovi prima le associazioni.`, 'error');
      if (!media.external_url) {
        const { error: storageError } = await client.storage.from('portfolio-media').remove([media.object_path]);
        if (storageError) return notify('File non eliminato dallo Storage.', 'error');
      }
      const { error } = await client.from('media_assets').delete().eq('id', media.id);
      if (error) return notify('Metadati non eliminati.', 'error');
      await refreshAll(); notify('Media eliminato.');
    }
  });

  mediaForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!mediaForm.reportValidity() || mediaForm.dataset.busy === 'true') return;
    const file = mediaForm.elements.file.files[0];
    const id = mediaForm.elements.id.value;
    const externalUrl = String(mediaForm.elements.external_url.value || '').trim();
    const allowed = ['image/jpeg','image/png','image/webp','video/mp4','video/webm'];
    if (!file && !id && !externalUrl) return notify('Seleziona un file o indica un URL video HTTPS.', 'error');
    if (externalUrl && (!tools.validHttpUrl(externalUrl) || new URL(externalUrl).protocol !== 'https:' || !/\.(mp4|webm)(?:$|[?#])/i.test(new URL(externalUrl).pathname))) return notify('L’URL esterno deve essere HTTPS e puntare a un file MP4 o WebM.', 'error');
    if (file && !allowed.includes(file.type)) return notify('Formato file non consentito.', 'error');
    if (file && file.size > (file.type.startsWith('video/') ? 104857600 : 12582912)) return notify('Il file supera il limite consentito.', 'error');
    if (mediaForm.elements.status.value === 'published' && !await confirmAction('Pubblicare il media?', 'Dopo il salvataggio il file potrà essere usato dalla pagina pubblica tramite URL firmato.')) return;
    setFormBusy(mediaForm, true);
    try {
      const altIt = tools.safeText(mediaForm.elements.alt_it.value, 300);
      const altEn = tools.safeText(mediaForm.elements.alt_en.value, 300);
      const titleInternal = tools.safeText(mediaForm.elements.title_internal.value, 180);
      const caption = tools.safeText(mediaForm.elements.caption.value, 500);
      const posterMediaId = mediaForm.elements.poster_media_id.value || null;
      if (altIt.length < 2 || altEn.length < 2) throw new Error('Alt text italiano e inglese sono obbligatori.');
      if (!file && !id && externalUrl) {
        const externalId = crypto.randomUUID();
        const { error } = await client.from('media_assets').insert({ object_path: `media/external/${externalId}.url`, original_name: `video-esterno-${externalId}.url`, mime_type: 'video/mp4', size_bytes: 1, media_type: 'video', title_internal: titleInternal, caption, external_url: externalUrl, poster_media_id: posterMediaId, alt_it: altIt, alt_en: altEn, status: mediaForm.elements.status.value });
        if (error) throw new Error('Metadati del video esterno non salvati.');
        resetMediaForm(); await refreshAll(); notify('Video esterno aggiunto.'); return;
      }
      if (!file && id) {
        const { error } = await client.from('media_assets').update({ alt_it: altIt, alt_en: altEn, title_internal: titleInternal, caption, external_url: externalUrl || null, poster_media_id: posterMediaId, status: mediaForm.elements.status.value }).eq('id', id);
        if (error) throw new Error('Metadati non salvati.');
        resetMediaForm(); await refreshAll(); notify('Media aggiornato.'); return;
      }
      const extension = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '');
      const safeName = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'media';
      const objectPath = `media/${new Date().getFullYear()}/${crypto.randomUUID()}-${safeName}.${extension}`;
      const { error: uploadError } = await client.storage.from('portfolio-media').upload(objectPath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw new Error('Upload non riuscito.');
      const payload = { object_path: objectPath, original_name: file.name, mime_type: file.type, size_bytes: file.size, media_type: file.type.startsWith('video/') ? 'video' : 'image', title_internal: titleInternal, caption, external_url: externalUrl || null, poster_media_id: posterMediaId, alt_it: altIt, alt_en: altEn, status: mediaForm.elements.status.value };
      const { error } = id ? await client.from('media_assets').update(payload).eq('id', id) : await client.from('media_assets').insert(payload);
      if (error) { await client.storage.from('portfolio-media').remove([objectPath]); throw new Error('Metadati non salvati.'); }
      const oldPath = mediaForm.elements.existing_path.value;
      const previous = state.media.find((item) => item.id === id);
      if (id && oldPath && oldPath !== objectPath && !previous?.external_url) await client.storage.from('portfolio-media').remove([oldPath]);
      resetMediaForm(); await refreshAll(); notify(id ? 'Media sostituito.' : 'Media caricato.');
    } catch (error) { reportError('Gestione media', error); notify(error.message, 'error'); } finally { setFormBusy(mediaForm, false); }
  });
  document.querySelector('[data-cancel-media]').addEventListener('click', resetMediaForm);
  document.querySelectorAll('[data-media-search],[data-media-type-filter],[data-media-section-filter]').forEach((control) => control.addEventListener('input', renderMedia));

  const sectionKeys = Object.keys(labels);
  const placementDialog = document.querySelector('[data-placement-dialog]');
  const placementForm = document.querySelector('[data-placement-form]');
  const sectionMediaList = document.querySelector('[data-section-media-list]');

  function fillSelect(select, entries, selected = '') {
    select.replaceChildren(...entries.map(([value, text]) => { const option = tools.make('option', { text }); option.value = value; return option; }));
    select.value = selected;
  }

  function renderSectionMedia() {
    const contentId = contentForm.elements.id.value;
    const placements = state.placements.filter((placement) => placement.section_key === state.currentType && (!contentId || placement.content_item_id === contentId)).sort((a, b) => a.sort_order - b.sort_order);
    sectionMediaList.replaceChildren(...placements.map((placement) => {
      const media = state.media.find((item) => item.id === placement.media_id);
      const row = tools.make('article', { className: 'placement-row' });
      const copy = tools.make('div');
      copy.append(statusBadge(placement.is_visible ? 'published' : 'hidden'), tools.make('strong', { text: media?.title_internal || media?.original_name || 'Media non disponibile' }), tools.make('small', { text: `${placement.aspect_ratio} · ${placement.fit} · ordine ${placement.sort_order}` }));
      const actions = tools.make('div', { className: 'item-actions' });
      actions.append(actionButton('Configura', 'edit-placement', placement.id), actionButton(placement.is_visible ? 'Nascondi' : 'Pubblica', 'toggle-placement', placement.id), actionButton('Elimina', 'delete-placement', placement.id));
      row.append(copy, actions); return row;
    }));
    if (!placements.length) sectionMediaList.append(tools.make('p', { className: 'help-copy', text: contentId ? 'Nessun media assegnato a questo elemento.' : 'Salva il contenuto per poter assegnare media.' }));
  }

  function placementPayload(form) {
    const value = (name) => form.elements[name].value;
    const numberOrNull = (name) => value(name) === '' ? null : Number(value(name));
    const autoplay = form.elements.autoplay.checked;
    const muted = form.elements.muted.checked;
    if (autoplay && !muted) throw new Error('L’autoplay è consentito soltanto con audio disattivato.');
    return { media_id: value('media_id'), section_key: value('section_key'), content_item_id: value('content_item_id') || null, sort_order: Number(value('sort_order')), is_visible: value('is_visible') === 'true', aspect_ratio: value('aspect_ratio'), fit: value('fit'), position_x: Number(value('position_x')), position_y: Number(value('position_y')), focal_x: Number(value('focal_x')), focal_y: Number(value('focal_y')), max_width: numberOrNull('max_width'), max_height: numberOrNull('max_height'), border_radius: Number(value('border_radius')), opacity: Number(value('opacity')), overlay: tools.safeText(value('overlay'), 80), desktop_behavior: value('desktop_behavior'), mobile_behavior: value('mobile_behavior'), autoplay, loop: form.elements.loop.checked, muted, controls: form.elements.controls.checked, preload: value('preload') };
  }

  function renderPlacementPreview() {
    let payload;
    try { payload = placementPayload(placementForm); } catch (error) { return; }
    const media = state.media.find((item) => item.id === payload.media_id);
    document.querySelectorAll('[data-placement-preview]').forEach((box) => {
      box.replaceChildren();
      if (!media) return box.append(tools.make('span', { text: 'Seleziona un media' }));
      const hidden = box.dataset.placementPreview === 'mobile' ? payload.mobile_behavior === 'hide' : payload.desktop_behavior === 'hide';
      if (hidden) return box.append(tools.make('span', { text: 'Nascosto su questo dispositivo' }));
      const element = media.media_type === 'video' ? tools.make('video') : tools.make('img');
      element.src = publicMediaUrl(media); element.alt = media.alt_it || '';
      if (element instanceof HTMLVideoElement) { element.muted = true; element.controls = true; }
      element.style.cssText = `width:100%;height:100%;object-fit:${payload.fit === 'natural' ? 'contain' : payload.fit};object-position:${payload.focal_x}% ${payload.focal_y}%;border-radius:${payload.border_radius}px;opacity:${payload.opacity}`;
      box.style.aspectRatio = payload.aspect_ratio === 'auto' ? '16 / 9' : payload.aspect_ratio;
      box.append(element);
    });
  }

  function openPlacement(placement = null) {
    placementForm.reset();
    fillSelect(placementForm.elements.media_id, state.media.filter((media) => ['image','video'].includes(media.media_type)).map((media) => [media.id, media.title_internal || media.original_name]), placement?.media_id || '');
    fillSelect(placementForm.elements.section_key, sectionKeys.map((key) => [key, labels[key]]), placement?.section_key || state.currentType);
    placementForm.elements.id.value = placement?.id || '';
    placementForm.elements.content_item_id.value = placement?.content_item_id || contentForm.elements.id.value || '';
    const defaults = { sort_order: 0, is_visible: false, aspect_ratio: 'auto', fit: 'cover', position_x: 50, position_y: 50, focal_x: 50, focal_y: 50, max_width: '', max_height: '', border_radius: 12, opacity: 1, overlay: '', desktop_behavior: 'show', mobile_behavior: 'show', preload: 'metadata' };
    Object.entries({ ...defaults, ...(placement || {}) }).forEach(([key, value]) => { if (placementForm.elements[key] && !['autoplay','loop','muted','controls'].includes(key)) placementForm.elements[key].value = String(value ?? ''); });
    ['autoplay','loop','muted','controls'].forEach((key) => { placementForm.elements[key].checked = placement ? Boolean(placement[key]) : ['muted','controls'].includes(key); });
    document.querySelector('[data-duplicate-placement]').hidden = !placement;
    renderPlacementPreview(); placementDialog.showModal();
  }

  document.querySelector('[data-add-placement]').addEventListener('click', () => {
    if (!contentForm.elements.id.value) return notify('Salva prima il contenuto.', 'error');
    if (!state.media.length) return notify('Carica prima un elemento nella libreria Media.', 'error');
    openPlacement();
  });
  placementForm.addEventListener('input', renderPlacementPreview);
  placementForm.addEventListener('submit', async (event) => {
    event.preventDefault(); if (!placementForm.reportValidity()) return;
    try {
      const payload = placementPayload(placementForm);
      const media = state.media.find((item) => item.id === payload.media_id);
      if (payload.is_visible && media?.status !== 'published') throw new Error('Pubblica prima il media nella libreria.');
      const id = placementForm.elements.id.value;
      const { error } = id ? await client.from('media_placements').update(payload).eq('id', id) : await client.from('media_placements').insert(payload);
      if (error) throw error;
      placementDialog.close(); await refreshAll(); notify('Configurazione media salvata.');
    } catch (error) { reportError('Configurazione media', error); notify(error.message, 'error'); }
  });
  document.querySelector('[data-duplicate-placement]').addEventListener('click', async () => {
    try { const payload = placementPayload(placementForm); payload.sort_order += 1; const { error } = await client.from('media_placements').insert(payload); if (error) throw error; placementDialog.close(); await refreshAll(); notify('Configurazione duplicata.'); } catch (error) { notify(error.message, 'error'); }
  });
  sectionMediaList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]'); if (!button) return;
    const placement = state.placements.find((item) => item.id === button.dataset.id); if (!placement) return;
    if (button.dataset.action === 'edit-placement') return openPlacement(placement);
    if (button.dataset.action === 'toggle-placement') { const media = state.media.find((item) => item.id === placement.media_id); if (!placement.is_visible && media?.status !== 'published') return notify('Pubblica prima il media nella libreria.', 'error'); const { error } = await client.from('media_placements').update({ is_visible: !placement.is_visible }).eq('id', placement.id); if (error) return notify('Stato non aggiornato.', 'error'); await refreshAll(); }
    if (button.dataset.action === 'delete-placement') { if (!await confirmAction('Rimuovere l’associazione?', 'Il file resterà nella libreria Media.')) return; const { error } = await client.from('media_placements').delete().eq('id', placement.id); if (error) return notify('Associazione non rimossa.', 'error'); await refreshAll(); }
  });

  function renderMessages() {
    const filter = document.querySelector('[data-message-filter]').value;
    const list = document.querySelector('[data-message-list]');
    const messages = state.messages.filter((message) => !filter || message.status === filter);
    list.replaceChildren(...messages.map((message) => {
      const button = tools.make('button', { className: `message-row ${message.status === 'new' ? 'is-new' : ''}`, type: 'button' }); button.dataset.messageId = message.id;
      button.append(statusBadge(message.status === 'replied' ? 'published' : message.status === 'new' ? 'draft' : 'hidden'), tools.make('strong', { text: message.subject }), tools.make('span', { text: `${message.sender_name} · ${formatDate(message.created_at)}` })); return button;
    }));
    if (!messages.length) list.append(tools.make('p', { text: 'Nessun messaggio.' }));
    const unread = state.messages.filter((message) => message.status === 'new').length;
    const badge = document.querySelector('[data-unread-count]'); badge.hidden = !unread; badge.textContent = String(unread);
  }

  async function openMessage(message) {
    if (message.status === 'new') { await client.from('contact_messages').update({ status: 'read', read_at: new Date().toISOString() }).eq('id', message.id); message.status = 'read'; renderMessages(); }
    const detail = document.querySelector('[data-message-detail]'); detail.replaceChildren();
    const title = tools.make('h2', { text: message.subject });
    const meta = tools.make('p', { className: 'message-meta', text: `${message.sender_name} <${message.sender_email}> · ${formatDate(message.created_at)}${message.company ? ` · ${message.company}` : ''}` });
    const original = tools.make('div', { className: 'message-original', text: message.message_text });
    const history = tools.make('div', { className: 'reply-history' });
    state.replies.filter((reply) => reply.message_id === message.id).forEach((reply) => { const item = tools.make('article'); item.append(statusBadge(reply.status === 'sent' ? 'published' : reply.status === 'failed' ? 'draft' : 'hidden'), tools.make('time', { text: formatDate(reply.created_at) }), tools.make('p', { text: reply.reply_text })); if (reply.status === 'failed') item.append(actionButton('Riprova invio', 'retry-reply', reply.id)); history.append(item); });
    const form = tools.make('form', { className: 'reply-form' }); form.dataset.replyForm = message.id;
    const label = tools.make('label', { text: 'Risposta' }); const textarea = tools.make('textarea'); textarea.name = 'reply'; textarea.rows = 9; textarea.required = true; textarea.maxLength = 10000; label.append(textarea);
    const preview = tools.make('div', { className: 'reply-preview' }); preview.append(tools.make('strong', { text: `Re: ${message.subject}` }), tools.make('p', { text: 'Anteprima della risposta' }), tools.make('small', { text: 'Gaetano Russo – IT Specialist' }));
    textarea.addEventListener('input', () => { preview.querySelector('p').textContent = textarea.value || 'Anteprima della risposta'; state.replyDraftDirty = Boolean(textarea.value.trim()); });
    const actions = tools.make('div', { className: 'form-actions' }); const send = tools.make('button', { className: 'button primary', type: 'submit', text: 'Invia risposta' }); actions.append(send, actionButton('Archivia', 'archive-message', message.id), actionButton('Elimina', 'delete-message', message.id));
    form.append(label, preview, actions); detail.append(title, meta, original, tools.make('h3', { text: 'Storico risposte' }), history, form);
  }

  document.querySelector('[data-message-filter]').addEventListener('change', renderMessages);
  document.querySelector('[data-message-list]').addEventListener('click', (event) => { const row = event.target.closest('[data-message-id]'); const message = state.messages.find((item) => item.id === row?.dataset.messageId); if (message) openMessage(message); });
  document.querySelector('[data-message-detail]').addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]'); if (!button) return;
    if (button.dataset.action === 'archive-message') { await client.from('contact_messages').update({ status: 'archived', archived_at: new Date().toISOString() }).eq('id', button.dataset.id); await refreshAll(); }
    if (button.dataset.action === 'delete-message') { if (!await confirmAction('Eliminare il messaggio?', 'Verranno eliminate anche tutte le risposte associate.')) return; await client.from('contact_messages').delete().eq('id', button.dataset.id); document.querySelector('[data-message-detail]').innerHTML = '<p>Messaggio eliminato.</p>'; await refreshAll(); }
    if (button.dataset.action === 'retry-reply') {
      if (button.disabled) return;
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = 'Invio in corso…';
      try { await sendReply(state.replies.find((item) => item.id === button.dataset.id)); }
      finally { if (document.contains(button)) { button.disabled = false; button.textContent = originalText; } }
    }
  });
  document.querySelector('[data-message-detail]').addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-reply-form]'); if (!form) return; event.preventDefault(); if (!form.reportValidity()) return;
    const submitButton = form.querySelector('button[type=submit]');
    if (submitButton.disabled) return;
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Invio in corso…';
    try {
      const token = crypto.randomUUID(); const replyText = tools.safeText(form.elements.reply.value, 10000);
      const { data, error } = await client.from('message_replies').insert({ message_id: form.dataset.replyForm, reply_text: replyText, client_token: token }).select().single();
      if (error) return notify('Risposta non salvata.', 'error');
      if (await sendReply(data)) state.replyDraftDirty = false;
    } catch (error) { reportError('Preparazione risposta', error); notify('Risposta non inviata. Riprova.', 'error', true); }
    finally { if (document.contains(submitButton)) { submitButton.disabled = false; submitButton.textContent = originalText; } }
  });
  async function sendReply(reply) {
    if (!reply) return false;
    try {
      const { data } = await client.auth.getSession();
      const response = await fetch('/api/reply-message', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}` }, body: JSON.stringify({ replyId: reply.id }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) {
        const error = new Error(result.error || 'Risposta non inviata.');
        error.code = result.code || `HTTP_${response.status}`;
        error.requestId = result.requestId || response.headers.get('X-Request-Id') || '';
        throw error;
      }
      await refreshAll();
      const message = state.messages.find((item) => item.id === reply.message_id);
      if (message) openMessage(message);
      notify('Risposta inviata correttamente.', 'success', true);
      return true;
    } catch (error) {
      reportError('Invio risposta email', { name: error.code || 'reply_error', message: error.requestId ? `${error.message} Request ID: ${error.requestId}` : error.message });
      notify(error.message || 'Risposta non inviata. Puoi riprovare.', 'error', true);
      return false;
    }
  }
  contentForm.addEventListener('input', (event) => { if (event.target.matches('[name]')) state.contentDraftDirty = true; });
  mediaForm.addEventListener('input', (event) => { if (event.target.matches('[name]')) state.mediaDraftDirty = true; });
  document.querySelector('[data-settings-form]').addEventListener('input', (event) => { if (event.target.matches('[name]')) state.settingsDraftDirty = true; });
  window.addEventListener('beforeunload', (event) => { if (!state.replyDraftDirty && !state.contentDraftDirty && !state.mediaDraftDirty && !state.settingsDraftDirty) return; event.preventDefault(); event.returnValue = ''; });

  function configuredPublicOrigin() {
    try { return qrTools.normalizePublicUrl(backend?.config.publicSiteUrl || ''); } catch (error) { return ''; }
  }

  function normalizeQrUrl(value) {
    if (!qrTools) throw new Error('Strumenti QR locali non disponibili. Ricarica la pagina.');
    const normalized = qrTools.normalizePublicUrl(value);
    const configured = configuredPublicOrigin();
    if (configured && normalized !== configured) throw new Error('L’URL deve coincidere con PUBLIC_SITE_URL configurato per il portfolio.');
    return normalized;
  }

  function mountQrPreview(svgText) {
    const parsed = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const svg = parsed.documentElement;
    if (svg.nodeName.toLowerCase() !== 'svg' || parsed.querySelector('parsererror')) throw new Error('Anteprima SVG non valida.');
    document.querySelector('[data-qr-preview]').replaceChildren(document.importNode(svg, true));
  }

  async function generateQr(url) {
    const normalized = normalizeQrUrl(url);
    const qrCode = window.QRCode;
    if (!qrCode?.create || !qrCode?.toCanvas || !qrCode?.toString) throw new Error('Libreria QR locale non disponibile. Ricarica la pagina.');
    state.qrSvg = qrTools.responsiveSvg(await qrCode.toString(normalized, { type: 'svg', margin: qrTools.QUIET_ZONE_MODULES, color: { dark: '#07111fff', light: '#ffffffff' }, errorCorrectionLevel: 'H' }));
    state.qrUrl = normalized;
    mountQrPreview(state.qrSvg);
    document.querySelector('[data-qr-preview]').setAttribute('aria-label', `QR Code completo per ${normalized}`);
    document.querySelector('[data-qr-url]').textContent = normalized;
    document.querySelector('[data-qr-warning]').textContent = 'Anteprima pronta: questo è l’URL realmente codificato.';
    document.querySelectorAll('[data-download-png],[data-download-svg]').forEach((button) => { button.disabled = false; });
  }

  const qrForm = document.querySelector('[data-qr-form]');
  qrForm.elements.url.value = '';
  qrForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = qrForm.querySelector('button[type=submit]');
    if (button.disabled) return;
    button.disabled = true;
    try {
      await generateQr(qrForm.elements.url.value);
      const { error } = await client.from('site_settings').upsert({ key: 'site.public_url', value: state.qrUrl, is_public: true }, { onConflict: 'key' });
      if (error) throw error;
      await loadSettings(); renderSettings();
      notify('URL salvato e QR Code rigenerato. Verifica la scansione prima della stampa.');
    } catch (error) {
      state.qrUrl = ''; state.qrSvg = '';
      document.querySelector('[data-qr-preview]').replaceChildren();
      document.querySelectorAll('[data-download-png],[data-download-svg]').forEach((downloadButton) => { downloadButton.disabled = true; });
      document.querySelector('[data-qr-warning]').textContent = error.message;
      reportError('Generazione QR Code', error); notify(error.message, 'error');
    } finally { button.disabled = false; }
  });
  function downloadBlob(blob, fileName) { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = fileName; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  function drawRoundRect(context, x, y, width, height, radius) { context.beginPath(); context.roundRect(x, y, width, height, radius); context.fill(); }
  async function renderExportQr(maximumSize) {
    const qrCode = window.QRCode;
    const moduleCount = qrCode.create(state.qrUrl, { errorCorrectionLevel: 'H' }).modules.size;
    const render = qrTools.integerRenderSize(moduleCount, maximumSize);
    const canvas = document.createElement('canvas');
    await qrCode.toCanvas(canvas, state.qrUrl, { scale: render.scale, margin: qrTools.QUIET_ZONE_MODULES, color: { dark: '#07111fff', light: '#ffffffff' }, errorCorrectionLevel: 'H' });
    canvas.getContext('2d').imageSmoothingEnabled = false;
    return canvas;
  }
  async function createCardCanvas() {
    if (!state.qrUrl) throw new Error('Configura prima un URL pubblico valido.');
    if (document.fonts?.ready) await document.fonts.ready;
    const format = qrTools.formatName(qrForm.elements.format.value); const geometry = qrTools.cardGeometry(format); const textLayout = qrTools.cardTextLayout(format);
    const canvas = document.createElement('canvas'); canvas.width = geometry.width; canvas.height = geometry.height; const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    const gradient = context.createLinearGradient(0, 0, geometry.width, geometry.height); gradient.addColorStop(0, '#07111f'); gradient.addColorStop(1, '#12283d'); context.fillStyle = gradient; context.fillRect(0, 0, geometry.width, geometry.height);
    context.fillStyle = '#e1b765'; drawRoundRect(context, textLayout.logoX, textLayout.logoY, 120, 120, 22); context.fillStyle = '#07111f'; context.font = '800 54px system-ui'; context.textAlign = 'center'; context.fillText('GR', textLayout.logoX + 60, textLayout.logoY + 78);
    context.textAlign = 'left'; context.fillStyle = '#edf3f6'; context.font = '800 62px system-ui'; context.fillText('Gaetano Russo', textLayout.nameX, textLayout.nameY); context.fillStyle = '#e1b765'; context.font = '600 34px system-ui'; context.fillText('IT Specialist', textLayout.nameX, textLayout.roleY);
    const qrCanvas = await renderExportQr(geometry.qr); const qrX = geometry.x + Math.floor((geometry.qr - qrCanvas.width) / 2); const qrY = geometry.y + Math.floor((geometry.qr - qrCanvas.height) / 2);
    context.fillStyle = '#ffffff'; drawRoundRect(context, geometry.x - 36, geometry.y - 36, geometry.qr + 72, geometry.qr + 72, 28); context.drawImage(qrCanvas, qrX, qrY);
    context.fillStyle = '#edf3f6'; context.font = '600 34px system-ui'; context.fillText('Scansiona per visitare il mio portfolio', textLayout.logoX, textLayout.copyY); context.fillStyle = '#9eacb7'; context.font = '26px system-ui'; context.fillText(state.qrUrl.slice(0, 74), textLayout.logoX, textLayout.urlY); return canvas;
  }
  function canvasBlob(canvas) { return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Esportazione PNG non riuscita.')), 'image/png')); }
  async function runQrDownload(button, task) { if (button.disabled || button.dataset.busy) return; button.dataset.busy = 'true'; button.disabled = true; try { await task(); } catch (error) { reportError('Esportazione QR', error); notify(error.message, 'error'); } finally { delete button.dataset.busy; button.disabled = !state.qrUrl; } }
  document.querySelector('[data-download-png]').addEventListener('click', (event) => runQrDownload(event.currentTarget, async () => { const format = qrTools.formatName(qrForm.elements.format.value); const canvas = await createCardCanvas(); downloadBlob(await canvasBlob(canvas), qrTools.downloadName(format, 'png')); }));
  document.querySelector('[data-download-svg]').addEventListener('click', (event) => runQrDownload(event.currentTarget, async () => {
    if (!state.qrSvg || !state.qrUrl) throw new Error('Genera prima il QR Code.');
    if (document.fonts?.ready) await document.fonts.ready;
    const format = qrTools.formatName(qrForm.elements.format.value);
    const svg = qrTools.buildCardSvg(format, state.qrSvg, state.qrUrl);
    downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), qrTools.downloadName(format, 'svg'));
  }));
  function updateQrPreviewFormat() { const format = qrTools.formatName(qrForm.elements.format.value); document.querySelector('[data-qr-card]').dataset.format = format; }
  qrForm.elements.format.addEventListener('change', updateQrPreviewFormat);
  updateQrPreviewFormat();

  function settingValue(key, fallback) {
    const setting = state.settings.find((item) => item.key === key);
    return setting ? setting.value : fallback;
  }

  function renderSettings() {
    const form = document.querySelector('[data-settings-form]');
    form.elements.language.value = settingValue('site.language.default', 'it');
    form.elements.public_url.value = settingValue('site.public_url', '');
    const order = settingValue('sections.order', []);
    form.elements.section_order.value = Array.isArray(order) ? order.join(',') : '';
    state.settingsDraftDirty = false;
    const configuredUrl = String(form.elements.public_url.value || '');
    const runtimeUrl = String(backend?.config.publicSiteUrl || '');
    const candidate = runtimeUrl || configuredUrl;
    try {
      qrForm.elements.url.value = qrTools.normalizePublicUrl(candidate);
    } catch (error) {
      qrForm.elements.url.value = '';
      document.querySelector('[data-qr-warning]').textContent = 'Configura un URL pubblico HTTPS per abilitare anteprima e download.';
      document.querySelectorAll('[data-download-png],[data-download-svg]').forEach((button) => { button.disabled = true; });
    }
  }

  document.querySelector('[data-settings-form]').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (form.dataset.busy === 'true') return;
    const submittedPublicUrl = String(form.elements.public_url.value || '').trim();
    let publicUrl = '';
    try {
      publicUrl = submittedPublicUrl ? qrTools.normalizePublicUrl(submittedPublicUrl) : '';
      const configured = configuredPublicOrigin();
      if (publicUrl && configured && publicUrl !== configured) throw new Error('L’URL pubblico deve coincidere con PUBLIC_SITE_URL.');
    } catch (error) { return notify(error.message, 'error'); }
    let order;
    try {
      order = String(form.elements.section_order.value || '').split(',').map((item) => tools.safeText(item, 50)).filter(Boolean);
      if (order.some((item) => !/^[a-z0-9-]+$/.test(item))) throw new Error('Gli slug delle sezioni non sono validi.');
    } catch (error) { return notify(error.message, 'error'); }
    const rows = [
      { key: 'site.language.default', value: form.elements.language.value, is_public: true },
      { key: 'site.public_url', value: publicUrl, is_public: true },
      { key: 'sections.order', value: order, is_public: true }
    ];
    setFormBusy(form, true);
    try {
      const { error } = await client.from('site_settings').upsert(rows, { onConflict: 'key' });
      if (error) { reportError('Salvataggio impostazioni', error); return notify('Impostazioni non salvate.', 'error'); }
      await loadSettings(); renderSettings(); notify('Impostazioni salvate.');
    } finally { setFormBusy(form, false); }
  });

  async function openView(view, contentType, trigger) {
    const currentPanel = document.querySelector('[data-panel]:not([hidden])')?.dataset.panel;
    const changingContentType = currentPanel === 'content' && view === 'content' && contentType !== state.currentType;
    const leavingDirtyView = (currentPanel === 'content' && state.contentDraftDirty)
      || (currentPanel === 'media' && state.mediaDraftDirty)
      || (currentPanel === 'settings' && state.settingsDraftDirty);
    if ((currentPanel !== view || changingContentType) && leavingDirtyView) {
      if (!await confirmAction('Modifiche non salvate', 'Continuando perderai le modifiche non ancora salvate in questa sezione.')) return;
      state.contentDraftDirty = false; state.mediaDraftDirty = false; state.settingsDraftDirty = false;
    }
    document.querySelectorAll('[data-panel]').forEach((panel) => { panel.hidden = panel.dataset.panel !== view; });
    document.querySelectorAll('[data-view]').forEach((button) => button.classList.toggle('is-active', button === trigger));
    if (view === 'content') { state.currentType = contentType; resetContentForm(); contentForm.hidden = true; renderContent(); }
    if (view === 'qr' && !state.qrSvg && qrForm.elements.url.value) generateQr(qrForm.elements.url.value).catch((error) => { document.querySelector('[data-qr-warning]').textContent = error.message; });
    document.querySelector('[data-sidebar]').classList.remove('is-open');
    document.querySelector('[data-menu-toggle]').setAttribute('aria-expanded', 'false');
  }

  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => { openView(button.dataset.view, button.dataset.contentType, button).catch((error) => { reportError('Navigazione admin', error); notify('Impossibile cambiare sezione.', 'error'); }); }));
  document.querySelector('[data-menu-toggle]').addEventListener('click', (event) => { const sidebar = document.querySelector('[data-sidebar]'); const open = sidebar.classList.toggle('is-open'); event.currentTarget.setAttribute('aria-expanded', String(open)); });
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
