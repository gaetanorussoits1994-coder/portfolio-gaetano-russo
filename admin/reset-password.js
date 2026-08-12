(function () {
  'use strict';

  const form = document.querySelector('[data-reset-form]');
  const state = document.querySelector('[data-reset-state]');
  const message = document.querySelector('[data-reset-message]');
  const backend = window.portfolioBackend;
  const TIMEOUT_MS = 8000;
  let client = null;
  let clientInitialisationError = null;
  try { client = backend?.getClient() || null; } catch (error) { clientInitialisationError = error; }

  function reportError(phase, error) {
    if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return;
    let hostname = 'configurazione_non_valida';
    try { hostname = new URL(backend?.config?.supabaseUrl || '').hostname; } catch (urlError) { /* Safe diagnostic fallback. */ }
    const httpStatus = typeof error?.status === 'number' ? error.status : null;
    const supabaseCode = typeof error?.code === 'string' ? error.code : (error?.name || 'client_error');
    const errorMessage = typeof error?.message === 'string' ? error.message : 'Errore senza messaggio';
    console.error('[Portfolio Admin]', { phase, httpStatus, supabaseCode, message: errorMessage, hostname });
  }

  function withTimeout(promise, context) {
    let timer;
    const deadline = new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error(`${context} timeout dopo ${TIMEOUT_MS} ms`)), TIMEOUT_MS);
    });
    return Promise.race([Promise.resolve(promise), deadline]).finally(() => clearTimeout(timer));
  }

  function showState(title, copy) {
    form.hidden = true;
    state.hidden = false;
    state.querySelector('h1').textContent = title;
    state.querySelector('p').textContent = copy;
  }

  async function initialise() {
    try {
      if (!backend?.hasCredentials) return showState('Configurazione richiesta', 'Supabase non è configurato in questo ambiente.');
      if (clientInitialisationError) throw clientInitialisationError;
      if (!backend?.libraryAvailable || !client) throw new Error('Libreria Supabase locale non disponibile.');
      const { data, error } = await withTimeout(client.auth.getSession(), 'Verifica link di recupero');
      if (error) throw error;
      if (!data.session) return showState('Link non valido o scaduto', 'Richiedi una nuova email di recupero dalla pagina di accesso.');
      const { data: authorization, error: authorizationError } = await withTimeout(
        client.from('admin_users').select('user_id,is_active').eq('user_id', data.session.user.id).eq('is_active', true).maybeSingle(),
        'Verifica autorizzazione recupero'
      );
      if (authorizationError) throw authorizationError;
      if (!authorization?.is_active) {
        try { await withTimeout(client.auth.signOut(), 'Logout account non autorizzato'); } catch (signOutError) { reportError('Logout recupero non autorizzato', signOutError); }
        return showState('Account non autorizzato', 'Questo account non può modificare le credenziali dell’area amministrativa.');
      }
      state.hidden = true;
      form.hidden = false;
    } catch (error) {
      reportError('Inizializzazione recupero password', error);
      showState('Servizio non raggiungibile', 'Non è stato possibile verificare il link. Controlla la connessione e riprova.');
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = new FormData(form);
    const password = String(values.get('password') || '');
    const confirmation = String(values.get('confirm_password') || '');
    if (password.length < 12) return window.adminTools.setMessage(message, 'Usa almeno 12 caratteri.', 'error');
    if (password !== confirmation) return window.adminTools.setMessage(message, 'Le password non coincidono.', 'error');
    const button = form.querySelector('button[type=submit]');
    button.disabled = true;
    try {
      const { error } = await withTimeout(client.auth.updateUser({ password }), 'Aggiornamento password');
      if (error) {
        reportError('Aggiornamento password rifiutato', error);
        return window.adminTools.setMessage(message, 'Impossibile aggiornare la password. Il link potrebbe essere scaduto.', 'error');
      }
      form.reset();
      window.adminTools.setMessage(message, 'Password aggiornata. Ora puoi tornare alla pagina di accesso.', 'success');
    } catch (error) {
      reportError('Aggiornamento password', error);
      window.adminTools.setMessage(message, 'Servizio temporaneamente non raggiungibile. Riprova.', 'error');
    } finally { button.disabled = false; }
  });

  initialise();
})();
