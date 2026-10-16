const { createHmac, randomUUID, timingSafeEqual } = require('node:crypto');

const MAX_SESSION_AGE_MS = 2 * 60 * 60 * 1000;
const MAX_RUN_SECONDS = 60 * 60;
const RELAY_GOAL_METERS = 5_000_000;

function reply(res, status, body) {
  res.status(status).setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  const signingSecret = process.env.LEADERBOARD_SIGNING_SECRET;
  if (!url || !key || !signingSecret || signingSecret.length < 32) return null;
  return { url: url.replace(/\/$/, ''), key, signingSecret };
}

async function database(cfg, path, options = {}) {
  const response = await fetch(`${cfg.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: cfg.key,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(`Supabase request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return body;
}

function signSession(id, issuedAt, expiresAt, secret) {
  const payload = Buffer.from(JSON.stringify({ id, issuedAt, expiresAt })).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function readSession(token, secret) {
  if (typeof token !== 'string' || token.length > 512) return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;
  const expected = createHmac('sha256', secret).update(payload).digest();
  let supplied;
  try { supplied = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return value && typeof value.id === 'string' && Number.isFinite(value.issuedAt) && Number.isFinite(value.expiresAt)
      ? value : null;
  } catch { return null; }
}

function isSameOrigin(req) {
  if (req.headers['sec-fetch-site'] === 'cross-site') return false;
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim().toLowerCase();
  try { return new URL(origin).host.toLowerCase() === host; } catch { return false; }
}

async function fetchLeaderboard(cfg) {
  const [rows, totals] = await Promise.all([
    database(cfg, 'leaderboard?select=player_name,score,distance_meters,blockades,created_at&order=score.desc,created_at.asc&limit=10'),
    database(cfg, 'rpc/leaderboard_total_distance', { method: 'POST', body: '{}' }),
  ]);
  const totalMeters = Array.isArray(totals) ? Number(totals[0]?.total_meters || 0) : Number(totals?.total_meters || 0);
  return { leaderboard: Array.isArray(rows) ? rows : [], totalMeters: Number.isFinite(totalMeters) ? totalMeters : 0, relayGoalMeters: RELAY_GOAL_METERS };
}

function cleanName(value) {
  if (typeof value !== 'string') return 'Street runner';
  const name = value.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 18);
  return name || 'Street runner';
}

function validRun(body, session) {
  const score = Number(body.score), meters = Number(body.distanceMeters);
  const blockades = Number(body.blockades), elapsed = Number(body.elapsedSeconds);
  const now = Date.now();
  if (![score, meters, blockades, elapsed].every(Number.isFinite)) return null;
  if (![score, meters, blockades, elapsed].every(Number.isInteger)) return null;
  const signedDuration = (now - session.issuedAt) / 1000;
  if (session.expiresAt < now || session.issuedAt > now + 10_000 || signedDuration > MAX_SESSION_AGE_MS / 1000) return null;
  if (elapsed < 1 || elapsed > MAX_RUN_SECONDS || elapsed > signedDuration + 10) return null;
  if (score < 0 || score > Math.min(2_000_000, elapsed * 85 + 100)) return null;
  if (meters < 0 || meters > Math.min(25_000, Math.ceil(elapsed * 7.2 + 3))) return null;
  if (blockades < 0 || blockades > Math.ceil(elapsed * 1.4 + 1)) return null;
  return { score, meters, blockades, elapsed, playerName: cleanName(body.playerName) };
}

module.exports = async function leaderboardApi(req, res) {
  if (!isSameOrigin(req)) return reply(res, 403, { error: 'Same-origin requests only.' });
  const cfg = config();
  if (!cfg) return reply(res, 503, { error: 'Global leaderboard is not configured yet.' });

  try {
    if (req.method === 'GET') return reply(res, 200, await fetchLeaderboard(cfg));
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return reply(res, 405, { error: 'Method not allowed.' });
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || typeof body !== 'object') return reply(res, 400, { error: 'A JSON request body is required.' });

    if (body.action === 'start') {
      const id = randomUUID(), issuedAt = Date.now(), expiresAt = issuedAt + MAX_SESSION_AGE_MS;
      const forwarded = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
      const ipHash = createHmac('sha256', cfg.signingSecret).update(forwarded).digest('hex');
      const accepted = await database(cfg, 'rpc/issue_leaderboard_session', {
        method: 'POST', body: JSON.stringify({
          p_id: id, p_ip_hash: ipHash,
          p_started_at: new Date(issuedAt).toISOString(),
          p_expires_at: new Date(expiresAt).toISOString(),
        }),
      });
      if (accepted !== true) return reply(res, 429, { error: 'Too many runs from this network. Please try again later.' });
      return reply(res, 200, { sessionToken: signSession(id, issuedAt, expiresAt, cfg.signingSecret) });
    }

    if (body.action === 'submit') {
      const session = readSession(body.sessionToken, cfg.signingSecret);
      const run = session && validRun(body, session);
      if (!session || !run) return reply(res, 400, { error: 'This run could not be validated.' });
      const accepted = await database(cfg, 'rpc/submit_leaderboard_run', {
        method: 'POST', body: JSON.stringify({
          p_run_id: session.id, p_player_name: run.playerName, p_score: run.score,
          p_distance_meters: run.meters, p_blockades: run.blockades,
          p_elapsed_seconds: run.elapsed, p_started_at: new Date(session.issuedAt).toISOString(),
        }),
      });
      if (accepted !== true) return reply(res, 409, { error: 'This run was already submitted or its session expired.' });
      return reply(res, 201, await fetchLeaderboard(cfg));
    }
    return reply(res, 400, { error: 'Unknown leaderboard action.' });
  } catch (error) {
    console.error('Leaderboard request failed:', error.message);
    return reply(res, 503, { error: 'The global leaderboard is temporarily unavailable.' });
  }
};
