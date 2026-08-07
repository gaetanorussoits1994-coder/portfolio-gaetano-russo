(function () {
  'use strict';

  const config = window.PORTFOLIO_CONFIG || {};
  const hasCredentials = Boolean(config.supabaseUrl && config.supabaseAnonKey);
  const libraryAvailable = Boolean(window.supabase?.createClient);
  const configured = hasCredentials && libraryAvailable;
  let client = null;

  function getClient() {
    if (!configured) return null;
    if (!client) {
      client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce'
        }
      });
    }
    return client;
  }

  window.portfolioBackend = Object.freeze({ configured, hasCredentials, libraryAvailable, config, getClient });
})();
