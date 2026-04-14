export default function handler(req, res) {
  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || '';
  res.status(200).json({
    ok: true,
    hasRedisUrl: Boolean(rawUrl),
    redisUrlStartsWithHttps: rawUrl.startsWith('https://'),
    redisUrlHost: rawUrl ? rawUrl.replace(/^https?:\/\//, '').split('/')[0] : null,
    hasRedisToken: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
    method: req.method,
    now: new Date().toISOString(),
  });
}
