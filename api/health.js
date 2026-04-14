export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    hasRedisUrl: Boolean(process.env.UPSTASH_REDIS_REST_URL),
    hasRedisToken: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
    method: req.method,
    now: new Date().toISOString(),
  });
}
