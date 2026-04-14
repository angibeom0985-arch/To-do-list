import { sql } from '@vercel/postgres';

const MIN_KEY_LENGTH = 4;
const MAX_KEY_LENGTH = 80;

function normalizeKey(rawKey) {
  if (typeof rawKey !== 'string') return null;
  const trimmed = rawKey.trim();
  if (trimmed.length < MIN_KEY_LENGTH || trimmed.length > MAX_KEY_LENGTH) return null;
  return trimmed;
}

function toStorageKey(syncKey) {
  return `todo-sync:${syncKey}`;
}

function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return req.body;
}

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS sync_store (
      sync_key TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export default async function handler(req, res) {
  try {
    await ensureTable();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Failed to initialize storage table.',
      detail: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  if (req.method === 'GET') {
    const syncKey = normalizeKey(req.query?.key);
    if (!syncKey) {
      res.status(400).json({ error: 'A valid sync key is required (4~80 chars).' });
      return;
    }

    try {
      const storageKey = toStorageKey(syncKey);
      const result = await sql`SELECT data FROM sync_store WHERE sync_key = ${storageKey} LIMIT 1`;
      const data = result.rows[0]?.data ?? null;
      res.status(200).json({ data });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: 'Failed to read sync data.',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  if (req.method === 'PUT') {
    const body = readBody(req);
    if (!body) {
      res.status(400).json({ error: 'Request body JSON is invalid.' });
      return;
    }

    const syncKey = normalizeKey(body.key);
    if (!syncKey) {
      res.status(400).json({ error: 'A valid sync key is required (4~80 chars).' });
      return;
    }

    if (typeof body.data !== 'object' || body.data === null || Array.isArray(body.data)) {
      res.status(400).json({ error: 'Sync payload must be a JSON object.' });
      return;
    }

    try {
      const storageKey = toStorageKey(syncKey);
      await sql`
        INSERT INTO sync_store (sync_key, data, updated_at)
        VALUES (${storageKey}, ${body.data}, NOW())
        ON CONFLICT (sync_key)
        DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `;
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: 'Failed to write sync data.',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  res.status(405).json({ error: 'Method not allowed.' });
}
