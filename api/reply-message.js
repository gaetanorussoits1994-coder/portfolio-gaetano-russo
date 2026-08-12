'use strict';

const json = (response, status, body) => {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
};

const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

async function supabaseRequest(path, token, options = {}) {
  const response = await fetch(`${process.env.SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) throw Object.assign(new Error('Supabase request failed'), { status: response.status });
  return body;
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') return json(response, 405, { error: 'Metodo non consentito.' });
  const required = ['SUPABASE_URL','SUPABASE_ANON_KEY','PUBLIC_EMAILJS_PUBLIC_KEY','EMAILJS_PRIVATE_KEY','PUBLIC_EMAILJS_SERVICE_ID','EMAILJS_REPLY_TEMPLATE_ID'];
  if (required.some((key) => !process.env[key])) return json(response, 503, { error: 'Servizio email non configurato.' });
  const token = String(request.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const replyId = String(request.body?.replyId || '');
  if (!token || !/^[0-9a-f-]{36}$/i.test(replyId)) return json(response, 400, { error: 'Richiesta non valida.' });

  let claimed = false;
  try {
    const user = await supabaseRequest('/auth/v1/user', token);
    if (!user?.id) return json(response, 401, { error: 'Sessione non valida.' });
    const authorization = await supabaseRequest(`/rest/v1/admin_users?user_id=eq.${encodeURIComponent(user.id)}&is_active=eq.true&select=user_id`, token);
    if (!Array.isArray(authorization) || !authorization.length) return json(response, 403, { error: 'Amministratore non autorizzato.' });

    const claimedRows = await supabaseRequest(`/rest/v1/message_replies?id=eq.${encodeURIComponent(replyId)}&status=in.(queued,failed)&select=*`, token, {
      method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ status: 'sending', error_code: null })
    });
    if (!claimedRows.length) {
      const existing = await supabaseRequest(`/rest/v1/message_replies?id=eq.${encodeURIComponent(replyId)}&select=id,status`, token);
      if (existing[0]?.status === 'sent') return json(response, 200, { ok: true, duplicate: true });
      return json(response, 409, { error: 'Risposta già in elaborazione.' });
    }
    claimed = true;
    const reply = claimedRows[0];
    const messages = await supabaseRequest(`/rest/v1/contact_messages?id=eq.${encodeURIComponent(reply.message_id)}&select=*`, token);
    const message = messages[0];
    if (!message) throw new Error('Message missing');

    const providerResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: process.env.PUBLIC_EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_REPLY_TEMPLATE_ID,
        user_id: process.env.PUBLIC_EMAILJS_PUBLIC_KEY,
        accessToken: process.env.EMAILJS_PRIVATE_KEY,
        template_params: {
          to_email: message.sender_email,
          to_name: message.sender_name,
          subject: `Re: ${message.subject}`,
          reply_text: escapeHtml(reply.reply_text),
          original_subject: escapeHtml(message.subject),
          original_message: escapeHtml(message.message_text),
          signature: 'Gaetano Russo – IT Specialist'
        }
      })
    });
    if (!providerResponse.ok) throw Object.assign(new Error('Email provider rejected request'), { providerStatus: providerResponse.status });
    const sentAt = new Date().toISOString();
    await supabaseRequest(`/rest/v1/message_replies?id=eq.${encodeURIComponent(replyId)}`, token, { method: 'PATCH', body: JSON.stringify({ status: 'sent', sent_at: sentAt, provider_id: `emailjs:${replyId}`, error_code: null }) });
    await supabaseRequest(`/rest/v1/contact_messages?id=eq.${encodeURIComponent(message.id)}`, token, { method: 'PATCH', body: JSON.stringify({ status: 'replied' }) });
    return json(response, 200, { ok: true, sentAt });
  } catch (error) {
    if (claimed) {
      try { await supabaseRequest(`/rest/v1/message_replies?id=eq.${encodeURIComponent(replyId)}&status=neq.sent`, token, { method: 'PATCH', body: JSON.stringify({ status: 'failed', error_code: error.providerStatus ? `provider_${error.providerStatus}` : 'server_error' }) }); } catch (ignored) { /* Preserve the original failure. */ }
    }
    return json(response, error.status === 401 ? 401 : 502, { error: 'Invio non riuscito. Puoi riprovare senza creare duplicati.' });
  }
};
