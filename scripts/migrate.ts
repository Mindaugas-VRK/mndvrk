/**
 * Applies database migrations, then makes sure an admin exists.
 * Runs before every build on Vercel (see vercel.json) and via `npm run db:migrate`.
 *
 * On first deploy set ADMIN_EMAIL and ADMIN_PASSWORD; the admin is created only
 * when no users exist yet, so later deploys never touch existing accounts.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { count } from "drizzle-orm";
import postgres from "postgres";
import { users } from "../lib/db/schema";
import { hashPassword } from "../lib/auth/password";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    if (process.env.VERCEL) throw new Error("DATABASE_URL is not set. Connect a Neon database in Vercel → Storage.");
    console.log("DATABASE_URL not set, skipping migrations.");
    return;
  }
  const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✓ migrations applied");

  const [{ n }] = await db.select({ n: count() }).from(users);
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (n === 0 && email && password) {
    if (password.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters.");
    await db.insert(users).values({ email, name: "ESGCounts Admin", role: "admin", jobTitle: "Administrator", passwordHash: await hashPassword(password) });
    console.log(`✓ created first admin ${email}`);
  } else if (n === 0) {
    console.log("No users yet. Set ADMIN_EMAIL and ADMIN_PASSWORD (or run npm run db:seed) to create the first admin.");
  }
  await client.end();
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
