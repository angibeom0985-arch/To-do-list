import { Redis } from '@upstash/redis';

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

function assertRedisReady(res) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    res.status(500).json({
      error: 'Upstash Redis가 연결되지 않았습니다. Vercel 프로젝트 Integrations에서 Redis를 추가해주세요.',
    });
    return false;
  }

  return true;
}

function getRedisClient() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export default async function handler(req, res) {
  if (!assertRedisReady(res)) return;
  let redis;
  try {
    redis = getRedisClient();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Redis 클라이언트 초기화에 실패했습니다.' });
    return;
  }

  if (req.method === 'GET') {
    const syncKey = normalizeKey(req.query?.key);
    if (!syncKey) {
      res.status(400).json({ error: '유효한 동기화 키가 필요합니다 (4~80자).' });
      return;
    }

    try {
      const data = await redis.get(toStorageKey(syncKey));
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
      await redis.set(toStorageKey(syncKey), body.data);
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
