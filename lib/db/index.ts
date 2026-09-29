import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. See .env.example.");
  }
  const client = postgres(url, {
    // Serverless functions each hold their own pool, so keep it small.
    max: process.env.VERCEL ? 3 : 10,
    idle_timeout: 20,
    // Works with connection poolers (PgBouncer / Neon pooled endpoints).
    prepare: false,
  });
  return drizzle(client, { schema });
}

type Db = ReturnType<typeof createDb>;

// One pool per process; reused across hot reloads in development.
const globalForDb = globalThis as unknown as { db?: Db };

function getDb(): Db {
  if (!globalForDb.db) globalForDb.db = createDb();
  return globalForDb.db;
}

/** Lazily connects on first use so builds don't need a database. */
export const db = new Proxy({} as Db, {
  get(_, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export { schema };

/** First row of a query, or undefined. Usage: `await db.select()…where(…).then(first)`. */
export const first = <T>(rows: T[]): T | undefined => rows[0];
