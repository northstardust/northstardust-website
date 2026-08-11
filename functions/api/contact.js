// North Stardust — /api/contact
//
// Cloudflare Pages Function. Lives at functions/api/contact.js, which Pages
// maps to POST /api/contact automatically — no router, no framework, no
// wrangler.toml needed for this alone. This is the correct boundary for the
// *current* deployment: the repo has no wrangler.toml, no _worker.js and no
// Workers-specific config, and the project's own README already recommends
// Cloudflare Pages (build command: none, output: /) as the host. A plain
// Workers deployment would need a different entry point entirely; if this
// project is ever moved to Workers, this file's logic can move into a
// fetch() handler unchanged — only the export shape differs.
//
// Required environment variables (set in the Cloudflare Pages dashboard,
// Settings → Environment variables — never committed, never in client code):
//   RESEND_API_KEY     secret. API key for https://resend.com.
//   CONTACT_TO_EMAIL   e.g. northstardust.studio@gmail.com
//   CONTACT_FROM_EMAIL e.g. contact@northstardust.studio (must be a Resend-
//                      verified sending domain).
//
// Until those are configured this endpoint responds 503 rather than
// pretending to succeed, so the front end's error state is exercised
// honestly instead of silently swallowing messages.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = { firstName: 80, lastName: 80, email: 254, message: 4000 };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid request body.' }, 400);
  }

  // Honeypot: a hidden field real visitors never fill in. Silently accept
  // (so a bot gets no signal) without sending anything.
  if (clean(body.company)) {
    return json({ ok: true });
  }

  const firstName = clean(body.firstName);
  const lastName = clean(body.lastName);
  const email = clean(body.email);
  const message = clean(body.message);

  const errors = {};
  if (!firstName) errors.firstName = 'First name is required.';
  else if (firstName.length > MAX_LEN.firstName) errors.firstName = 'First name is too long.';
  if (!lastName) errors.lastName = 'Last name is required.';
  else if (lastName.length > MAX_LEN.lastName) errors.lastName = 'Last name is too long.';
  if (!email || !EMAIL_RE.test(email) || email.length > MAX_LEN.email) errors.email = 'A valid email address is required.';
  if (!message) errors.message = 'Message is required.';
  else if (message.length > MAX_LEN.message) errors.message = 'Message is too long.';

  if (Object.keys(errors).length) {
    return json({ ok: false, error: 'Please check the highlighted fields.', fields: errors }, 422);
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
    return json({
      ok: false,
      error: 'The contact endpoint is not configured yet. Please email northstardust.studio@gmail.com directly.',
    }, 503);
  }

  const safeFirst = escapeHtml(firstName);
  const safeLast = escapeHtml(lastName);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `North Stardust website <${env.CONTACT_FROM_EMAIL}>`,
        to: [env.CONTACT_TO_EMAIL],
        reply_to: email,
        subject: `New message from ${firstName} ${lastName}`,
        html: `<p><strong>${safeFirst} ${safeLast}</strong> (${safeEmail})</p><p>${safeMessage}</p>`,
        text: `${firstName} ${lastName} (${email})\n\n${message}`,
      }),
    });

    if (!resendResponse.ok) {
      return json({ ok: false, error: 'The message could not be sent. Please try again shortly.' }, 502);
    }
  } catch {
    return json({ ok: false, error: 'The message could not be sent. Please try again shortly.' }, 502);
  }

  return json({ ok: true });
}

export async function onRequestGet() {
  return json({ ok: false, error: 'Method not allowed.' }, 405);
}
