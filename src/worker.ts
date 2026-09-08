import studios from './data/studios.json';

interface D1Result<T> {
  results: T[];
  success: boolean;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<D1Result<unknown>>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface Env {
  ASSETS: { fetch: typeof fetch };
  DB: D1Database;
  TURNSTILE_SITEKEY: string;
  TURNSTILE_SECRET: string;
}

const RATE_LIMIT_WINDOW_MINUTES = 60;
const RATE_LIMIT_MAX = 3;
const DUPE_DISTANCE_METERS = 300;

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function verifyTurnstile(token: string, secret: string, ip: string): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token, remoteip: ip });
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  const data: { success: boolean } = await res.json();
  return data.success === true;
}

async function checkWebsiteReachable(url: string): Promise<boolean> {
  try {
    const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(withScheme, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'BerlinStudioMapBot/1.0 (+https://berlinstudiomaps.com)' },
    });
    clearTimeout(timeout);
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      `${query}, Berlin, Germany`
    )}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BerlinStudioMap/1.0 (hello@berlinstudiomaps.com)' },
    });
    if (!res.ok) return null;
    const data: Array<{ lat: string; lon: string }> = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

function findDedupeMatch(name: string, geo: { lat: number; lng: number } | null): string | null {
  const normalized = normalizeName(name);
  for (const s of studios as Array<{ name: string; lat: number; lng: number }>) {
    if (normalizeName(s.name) === normalized) return `name match: ${s.name}`;
    if (geo && haversineMeters(geo.lat, geo.lng, s.lat, s.lng) < DUPE_DISTANCE_METERS) {
      return `location match (<${DUPE_DISTANCE_METERS}m): ${s.name}`;
    }
  }
  return null;
}

async function handleSuggest(request: Request, env: Env, ip: string): Promise<Response> {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  // Honeypot: real visitors never fill this hidden field.
  if (typeof payload.company === 'string' && payload.company.trim() !== '') {
    return Response.json({ ok: true, status: 'received' });
  }

  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const website = typeof payload.website === 'string' ? payload.website.trim() : '';
  const neighbourhood = typeof payload.neighbourhood === 'string' ? payload.neighbourhood.trim() : '';
  const turnstileToken = typeof payload.turnstileToken === 'string' ? payload.turnstileToken : '';

  if (!name || !website || !neighbourhood) {
    return Response.json(
      { ok: false, error: 'Studio name, website, and neighbourhood are required.' },
      { status: 400 }
    );
  }

  if (!turnstileToken || !(await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET, ip))) {
    return Response.json({ ok: false, error: 'Captcha verification failed.' }, { status: 400 });
  }

  const { results: rateRows } = await env.DB.prepare(
    `SELECT COUNT(*) as n FROM suggestions WHERE submitter_ip = ? AND created_at > datetime('now', ?)`
  )
    .bind(ip, `-${RATE_LIMIT_WINDOW_MINUTES} minutes`)
    .all<{ n: number }>();
  if ((rateRows?.[0]?.n ?? 0) >= RATE_LIMIT_MAX) {
    return Response.json({ ok: false, error: 'Too many submissions, please try again later.' }, { status: 429 });
  }

  const [websiteReachable, geo] = await Promise.all([
    checkWebsiteReachable(website),
    geocode(`${name}, ${neighbourhood}`),
  ]);

  const dedupeMatch = findDedupeMatch(name, geo);

  let status = 'pending';
  let rejectReason: string | null = null;
  if (dedupeMatch) {
    status = 'auto_rejected';
    rejectReason = `Likely duplicate: ${dedupeMatch}`;
  } else if (!websiteReachable) {
    status = 'auto_rejected';
    rejectReason = 'Website did not respond.';
  }

  await env.DB.prepare(
    `INSERT INTO suggestions (
      name, neighbourhood, website, rate, sqm, ceil,
      daylight, blackout, ciclorama, drive_in, kitchen, makeup, green_room, wifi,
      notes, submitter_email, submitter_ip,
      website_reachable, geocode_lat, geocode_lng, dedupe_match, status, reject_reason
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  )
    .bind(
      name,
      neighbourhood,
      website,
      typeof payload.rate === 'string' ? payload.rate : null,
      typeof payload.sqm === 'string' ? payload.sqm : null,
      typeof payload.ceil === 'string' ? payload.ceil : null,
      payload.daylight ? 1 : 0,
      payload.blackout ? 1 : 0,
      payload.ciclorama ? 1 : 0,
      payload.driveIn ? 1 : 0,
      payload.kitchen ? 1 : 0,
      payload.makeup ? 1 : 0,
      payload.greenRoom ? 1 : 0,
      payload.wifi ? 1 : 0,
      typeof payload.notes === 'string' ? payload.notes : null,
      typeof payload.submitterEmail === 'string' ? payload.submitterEmail : null,
      ip,
      websiteReachable ? 1 : 0,
      geo?.lat ?? null,
      geo?.lng ?? null,
      dedupeMatch,
      status,
      rejectReason
    )
    .run();

  return Response.json({
    ok: true,
    status,
    message:
      status === 'auto_rejected'
        ? `Thanks, but this looks like it might already be listed or the website couldn't be reached (${rejectReason}). I'll take a manual look.`
        : "Thanks! I'll fact-check this and add it if it checks out.",
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/suggest' && request.method === 'POST') {
      const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
      return handleSuggest(request, env, ip);
    }
    return env.ASSETS.fetch(request);
  },
};
