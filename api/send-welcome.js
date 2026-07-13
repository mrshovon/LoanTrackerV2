// POST /api/send-welcome  { name, email }
//
// Sends the welcome email via Resend. Runs as a Vercel serverless function in
// production and is mounted by server.js for local development, so the same code
// path is exercised in both. RESEND_API_KEY stays server-side and is never sent
// to the browser.
//
// Required env:
//   RESEND_API_KEY  - from https://resend.com/api-keys
// Optional env:
//   APP_URL         - where the "Sign in" button points (default http://localhost:3000)
//   MAIL_FROM       - sender (default Resend's shared onboarding address)

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'Arclend <onboarding@resend.dev>';
const DEFAULT_APP_URL = 'http://localhost:3000';

// Best-effort abuse limit. This endpoint is unauthenticated by necessity - the
// user does not exist until signup succeeds - so cap how often one IP can send.
// Serverless instances are short-lived, so treat this as a speed bump, not a wall.
const RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 5 };
const recentSends = new Map(); // ip -> timestamp[]

function isRateLimited(ip) {
    const now = Date.now();
    const hits = (recentSends.get(ip) || []).filter(t => now - t < RATE_LIMIT.windowMs);
    if (hits.length >= RATE_LIMIT.max) {
        recentSends.set(ip, hits);
        return true;
    }
    hits.push(now);
    recentSends.set(ip, hits);
    return false;
}

function isValidEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function welcomeText(name, appUrl) {
    return [
        `Hi ${name},`,
        '',
        'Welcome to Arclend! Your account is ready.',
        '',
        'You can now keep every personal loan, credit card, bank EMI and shop credit',
        'in one place, and see exactly what you owe and what you have paid off.',
        '',
        `Sign in: ${appUrl}`,
        '',
        'Happy tracking,',
        'The Arclend Team'
    ].join('\n');
}

function welcomeHtml(name, appUrl) {
    const safeName = escapeHtml(name);
    const safeUrl = escapeHtml(appUrl);
    // Email clients cannot render SVG, and images need an absolute URL.
    const logoUrl = escapeHtml(String(appUrl).replace(/\/+$/, '') + '/public/brandImages/arclend-logo.png');
    return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <tr>
              <td align="center" style="padding:32px 32px 8px;">
                <img src="${logoUrl}" alt="Arclend" width="228" height="60" style="display:block;width:228px;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0;">
                <h1 style="margin:0;color:#0F6E56;font-size:22px;font-weight:700;">Welcome to Arclend</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px;color:#111827;font-size:16px;line-height:24px;">Hi ${safeName},</p>
                <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:24px;">
                  Your account is ready. Thanks for signing up!
                </p>
                <p style="margin:0 0 28px;color:#374151;font-size:16px;line-height:24px;">
                  You can now keep every personal loan, credit card, bank EMI and shop
                  credit in one place &mdash; and see at a glance exactly what you owe and
                  how much you have already paid off.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:8px;background-color:#0F6E56;">
                      <a href="${safeUrl}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;">Sign in to your account</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:28px 0 0;color:#6b7280;font-size:14px;line-height:22px;">
                  If the button does not work, paste this into your browser:<br />
                  <a href="${safeUrl}" style="color:#0F6E56;">${safeUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
                <p style="margin:0;color:#9ca3af;font-size:13px;line-height:20px;">
                  You are receiving this because someone signed up for Arclend with
                  this email address. If that was not you, you can ignore this message.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// Resend requires exactly "email@example.com" or "Name <email@example.com>".
// Env vars are stored literally, so a value pasted with wrapping quotes or stray
// whitespace arrives malformed. Clean it up, and fall back to the default sender
// rather than failing the send outright.
function normalizeFrom(raw) {
    if (!raw) return DEFAULT_FROM;

    const value = String(raw).trim().replace(/^["']|["']$/g, '').trim();
    const bare = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
    const named = /^[^<>]+<\s*[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+\s*>$/;

    if (bare.test(value) || named.test(value)) return value;

    console.warn(`MAIL_FROM is not a valid sender ("${raw}"); falling back to ${DEFAULT_FROM}. ` +
        'Use email@example.com or Name <email@example.com>, with no surrounding quotes.');
    return DEFAULT_FROM;
}

async function sendWelcomeEmail(name, email) {
    const appUrl = process.env.APP_URL || DEFAULT_APP_URL;
    const from = normalizeFrom(process.env.MAIL_FROM);

    const response = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: from,
            to: [email],
            subject: 'Welcome to Arclend',
            html: welcomeHtml(name, appUrl),
            text: welcomeText(name, appUrl)
        })
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Resend responded ${response.status}: ${detail}`);
    }
    return response.json();
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!process.env.RESEND_API_KEY) {
        console.error('send-welcome: RESEND_API_KEY is not set');
        return res.status(503).json({ error: 'Email is not configured' });
    }

    // Vercel parses JSON bodies; Express needs express.json() (see server.js).
    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    const name = String(body.name || '').trim().slice(0, 100);
    const email = String(body.email || '').trim();

    if (!name || !isValidEmail(email)) {
        return res.status(400).json({ error: 'A valid name and email are required' });
    }

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
        || (req.socket && req.socket.remoteAddress)
        || 'unknown';
    if (isRateLimited(ip)) {
        return res.status(429).json({ error: 'Too many requests' });
    }

    try {
        const result = await sendWelcomeEmail(name, email);
        return res.status(200).json({ ok: true, id: result && result.id });
    } catch (error) {
        // Surface Resend's own message - it names the actual problem (unverified
        // domain, bad key, test-mode recipient restriction). It contains no secrets.
        console.error('send-welcome failed:', error.message);
        return res.status(502).json({
            error: 'Could not send the welcome email',
            reason: error.message
        });
    }
};

// Exported for tests and for reuse by server.js
module.exports.welcomeHtml = welcomeHtml;
module.exports.welcomeText = welcomeText;
