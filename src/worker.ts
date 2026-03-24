import { createClient } from "@libsql/client/web";

export interface Env {
  DATABASE_URL: string;
  AUTH_TOKEN: string;
  ASSETS: Fetcher;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function getDb(env: Env) {
  return createClient({ url: env.DATABASE_URL, authToken: env.AUTH_TOKEN });
}

async function ensureSchema(env: Env): Promise<void> {
  const db = getDb(env);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sightings (
      id TEXT PRIMARY KEY,
      bundesland TEXT NOT NULL,
      browser_id TEXT NOT NULL,
      reported_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function handleGetSightings(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const year = url.searchParams.get("year");

  if (!year || !/^\d{4}$/.test(year)) {
    return json({ error: "year parameter required (YYYY)" }, 400);
  }

  const db = getDb(env);
  const result = await db.execute({
    sql: `SELECT bundesland, COUNT(*) as count
          FROM sightings
          WHERE strftime('%Y', reported_at) = ?
          GROUP BY bundesland`,
    args: [year],
  });

  const counts = result.rows.map((row) => ({
    bundesland: row.bundesland as string,
    count: Number(row.count),
  }));

  return json(counts);
}

async function handleGetYears(env: Env): Promise<Response> {
  const db = getDb(env);
  const result = await db.execute(`
    SELECT DISTINCT strftime('%Y', reported_at) as year
    FROM sightings
    ORDER BY year DESC
  `);
  const years = result.rows.map((row) => Number(row.year));
  const currentYear = new Date().getFullYear();
  if (!years.includes(currentYear)) years.unshift(currentYear);
  return json(years);
}

async function handlePostSighting(request: Request, env: Env): Promise<Response> {
  let body: { bundesland?: string; browser_id?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { bundesland, browser_id } = body;
  if (!bundesland || !browser_id) {
    return json({ error: "bundesland and browser_id are required" }, 400);
  }

  const db = getDb(env);

  // Rate limit: same browser_id within the last 3 hours (any Bundesland)
  const recent = await db.execute({
    sql: `SELECT reported_at FROM sightings
          WHERE browser_id = ?
          AND reported_at > datetime('now', '-3 hours')
          ORDER BY reported_at DESC
          LIMIT 1`,
    args: [browser_id],
  });

  if (recent.rows.length > 0) {
    const reportedAt = recent.rows[0].reported_at as string;
    const reportedMs = new Date(reportedAt + "Z").getTime();
    const unlockMs = reportedMs + 3 * 60 * 60 * 1000;
    const retryAfterSeconds = Math.ceil((unlockMs - Date.now()) / 1000);
    return json({ retry_after_seconds: Math.max(retryAfterSeconds, 1) }, 429);
  }

  const id = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO sightings (id, bundesland, browser_id) VALUES (?, ?, ?)`,
    args: [id, bundesland, browser_id],
  });

  return json({ id, bundesland }, 201);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === "/api/sightings") {
      // Ensure schema exists on first use (idempotent)
      await ensureSchema(env);

      if (request.method === "GET") return handleGetSightings(request, env);
      if (request.method === "POST") return handlePostSighting(request, env);
      return json({ error: "Method Not Allowed" }, 405);
    }

    if (url.pathname === "/api/years") {
      await ensureSchema(env);
      if (request.method === "GET") return handleGetYears(env);
      return json({ error: "Method Not Allowed" }, 405);
    }

    return env.ASSETS.fetch(request);
  },
};
