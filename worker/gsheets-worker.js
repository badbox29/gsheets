/**
 * gsheets-worker — KV Sync Worker
 * Deploy at: https://workers.cloudflare.com
 *
 * Provides cloud save/load for the Gsheets || Second Edition AD&D 2e
 * character sheet tool. Each user is identified by a unique sync token
 * stored in their browser. KV sync is entirely opt-in.
 *
 * Routes:
 *   GET  /ping  — Health check / worker URL verification
 *   GET  /kv    — Pull character data for this sync token
 *   POST /kv    — Push character data envelope for this sync token
 *
 * KV Binding:
 *   Bind a KV namespace called KV in your Cloudflare Worker settings.
 *
 * KV Key format:
 *   user:{token}  →  JSON envelope { version, updatedAt, clientId, payload }
 *
 * Payload structure:
 *   {
 *     characters: { [tabId]: characterData, ... },
 *     kvToken:    "...",
 *     kvEnabled:  true
 *   }
 *
 * Sync token rules:
 *   - Auto-generated in the browser (64 hex chars / 32 random bytes)
 *   - Stored in localStorage and travels with JSON exports
 *   - User can copy their token to a new browser to share the same KV namespace
 *   - Resetting the token permanently disconnects from the current KV data
 *
 * Size limit:  4 MB per user (Cloudflare KV value limit)
 * Expiration:  90 days, reset on every successful push
 */

// ── CORS headers ─────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Token',
  'Access-Control-Max-Age':       '86400',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
});

function getToken(request) {
  const token = (request.headers.get('X-Sync-Token') || '').trim();
  return token.length >= 32 ? token : null;
}

// ── /ping handler ─────────────────────────────────────────────────────────────
//
// Simple health check so the settings modal can verify the worker URL is
// correct before the user enables KV sync. Returns a fixed JSON response
// with no side effects.

function handlePing() {
  return json({
    ok:      true,
    service: 'gsheets-worker',
    message: 'Gsheets KV sync worker is reachable.',
  });
}

// ── GET /kv handler ───────────────────────────────────────────────────────────
//
// Retrieves the stored character data envelope for the given sync token.
// Returns { found: false } if no data exists yet for this token.

async function handleKvGet(request, env) {
  const token = getToken(request);
  if (!token) return json({ error: 'Missing or invalid sync token (must be 32+ chars)' }, 401);

  const kvKey = 'user:' + token;
  let val;
  try {
    val = await env.KV.get(kvKey);
  } catch (e) {
    return json({ error: 'KV read failed: ' + e.message }, 500);
  }

  if (val === null) return json({ found: false }, 200);

  try {
    const parsed = JSON.parse(val);
    return json({ found: true, data: parsed }, 200);
  } catch (e) {
    return json({ error: 'Corrupt KV data — try pushing from your primary browser' }, 500);
  }
}

// ── POST /kv handler ──────────────────────────────────────────────────────────
//
// Stores the character data envelope for the given sync token.
// Expects a JSON body with envelope fields: version, updatedAt, clientId, payload.
// Rejects payloads over 4 MB. Resets the 90-day KV expiration on every push.

async function handleKvPost(request, env) {
  const token = getToken(request);
  if (!token) return json({ error: 'Missing or invalid sync token (must be 32+ chars)' }, 401);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  // Validate envelope shape
  if (!body.version || !body.updatedAt || !body.payload) {
    return json({ error: 'Invalid sync envelope — expected: { version, updatedAt, clientId, payload }' }, 400);
  }

  // Payload must contain characters object
  if (typeof body.payload.characters !== 'object' || Array.isArray(body.payload.characters)) {
    return json({ error: 'Invalid payload — expected payload.characters to be an object' }, 400);
  }

  // Size guard — Cloudflare KV values max out at 25 MB but we enforce 4 MB
  // to keep sync fast and prevent abuse
  const raw = JSON.stringify(body);
  if (raw.length > 4 * 1024 * 1024) {
    return json({ error: 'Payload too large (max 4 MB) — try reducing character data' }, 413);
  }

  const kvKey = 'user:' + token;
  try {
    // expirationTtl resets on every push — 90 days of inactivity before data expires
    await env.KV.put(kvKey, raw, { expirationTtl: 90 * 24 * 60 * 60 });
  } catch (e) {
    return json({ error: 'KV write failed: ' + e.message }, 500);
  }

  return json({ ok: true, updatedAt: body.updatedAt }, 200);
}

// ── Main dispatcher ───────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const path = new URL(request.url).pathname.replace(/\/+$/, '');

    // Ping — GET only, no token required
    if (path === '/ping') {
      if (request.method !== 'GET') return json({ error: 'GET /ping only' }, 405);
      return handlePing();
    }

    // KV sync
    if (path === '/kv') {
      if (request.method === 'GET')  return handleKvGet(request, env);
      if (request.method === 'POST') return handleKvPost(request, env);
      return json({ error: 'Method not allowed for /kv — use GET or POST' }, 405);
    }

    return json({
      error: 'Unknown route.',
      routes: ['GET /ping', 'GET /kv', 'POST /kv'],
    }, 404);
  },
};
