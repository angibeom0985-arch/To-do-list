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

function getUpstashConfig(res) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    res.status(500).json({
      error: 'Upstash Redis 환경변수(UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)가 필요합니다.',
    });
    return null;
  }

  return { url: url.replace(/\/$/, ''), token };
}

async function runPipeline(config, commands) {
  const endpoint = `${config.url}/pipeline`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });

  if (!response.ok) {
    throw new Error(`Upstash pipeline failed: ${response.status}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload) || !payload.length) {
    throw new Error('Upstash pipeline returned empty response');
  }

  const first = payload[0];
  if (first?.error) {
    throw new Error(`Upstash pipeline error: ${first.error}`);
  }

  return first?.result ?? null;
}

async function upstashGet(config, redisKey) {
  const result = await runPipeline(config, [['GET', redisKey]]);
  if (result === null || result === undefined) return null;
  if (typeof result === 'string') {
    try {
      return JSON.parse(result);
    } catch {
      return result;
    }
  }
  return result;
}

async function upstashSet(config, redisKey, value) {
  await runPipeline(config, [['SET', redisKey, JSON.stringify(value)]]);
}

export default async function handler(req, res) {
  const config = getUpstashConfig(res);
  if (!config) return;

  if (req.method === 'GET') {
    const syncKey = normalizeKey(req.query?.key);
    if (!syncKey) {
      res.status(400).json({ error: '유효한 동기화 키가 필요합니다 (4~80자).' });
      return;
    }

    try {
      const data = await upstashGet(config, toStorageKey(syncKey));
      res.status(200).json({ data: data || null });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '동기화 데이터 조회에 실패했습니다.' });
    }
    return;
  }

  if (req.method === 'PUT') {
    const body = readBody(req);
    if (!body) {
      res.status(400).json({ error: '요청 본문(JSON)이 올바르지 않습니다.' });
      return;
    }

    const syncKey = normalizeKey(body.key);
    if (!syncKey) {
      res.status(400).json({ error: '유효한 동기화 키가 필요합니다 (4~80자).' });
      return;
    }

    if (typeof body.data !== 'object' || body.data === null || Array.isArray(body.data)) {
      res.status(400).json({ error: '저장할 데이터 형식이 올바르지 않습니다.' });
      return;
    }

    try {
      await upstashSet(config, toStorageKey(syncKey), body.data);
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '동기화 데이터 저장에 실패했습니다.' });
    }
    return;
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  res.status(405).json({ error: '허용되지 않은 메서드입니다.' });
}
