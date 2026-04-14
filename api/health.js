import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  let dbOk = false;
  let dbError = null;

  try {
    await sql`SELECT 1`;
    dbOk = true;
  } catch (error) {
    dbError = error instanceof Error ? error.message : String(error);
  }

  res.status(dbOk ? 200 : 500).json({
    ok: dbOk,
    hasPostgresUrl: Boolean(process.env.POSTGRES_URL),
    hasPostgresPrismaUrl: Boolean(process.env.POSTGRES_PRISMA_URL),
    hasPostgresUrlNonPooling: Boolean(process.env.POSTGRES_URL_NON_POOLING),
    dbError,
    method: req.method,
    now: new Date().toISOString(),
  });
}
