'use strict';

module.exports = function publicConfig(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.statusCode = 405;
    response.setHeader('Allow', 'GET, HEAD');
    response.end();
    return;
  }

  const config = {
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    publicSiteUrl: process.env.PUBLIC_SITE_URL || '',
    emailJsPublicKey: process.env.PUBLIC_EMAILJS_PUBLIC_KEY || '',
    emailJsServiceId: process.env.PUBLIC_EMAILJS_SERVICE_ID || '',
    emailJsContactTemplateId: process.env.PUBLIC_EMAILJS_CONTACT_TEMPLATE_ID || '',
    contactEmail: process.env.PUBLIC_CONTACT_EMAIL || ''
  };
  const body = `window.PORTFOLIO_CONFIG = Object.freeze(${JSON.stringify(config)});\n`;

  response.statusCode = 200;
  response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('Content-Length', Buffer.byteLength(body));
  response.end(request.method === 'HEAD' ? undefined : body);
};
