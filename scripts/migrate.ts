/**
 * Applies database migrations, then makes sure an admin exists.
 * Runs before every build on Vercel (see vercel.json) and via `npm run db:migrate`.
 *
 * Set ADMIN_EMAIL and ADMIN_PASSWORD; the admin is created if that email doesn't
 * exist yet. Existing passwords are only changed with RESET_ADMIN_PASSWORD=true.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { count, eq } from "drizzle-orm";
import postgres from "postgres";
import { users } from "../lib/db/schema";
import { hashPassword } from "../lib/auth/password";

/** Env values pasted into dashboards sometimes carry quotes or whitespace. */
function env(name: string) {
  return process.env[name]?.trim().replace(/^(['"])(.*)\1$/, "$2").trim() || undefined;
}

/**
 * Makes sure the admin from ADMIN_EMAIL exists. Creates it if missing (even when
 * other users exist). With RESET_ADMIN_PASSWORD=true it also resets that
 * account's password to ADMIN_PASSWORD and re-activates it as admin.
 */
async function ensureAdmin(db: ReturnType<typeof drizzle>) {
  const email = env("ADMIN_EMAIL")?.toLowerCase();
  const password = env("ADMIN_PASSWORD");
  if (!email || !password) {
    const [{ n }] = await db.select({ n: count() }).from(users);
    if (n === 0) console.log("⚠ No users yet and ADMIN_EMAIL / ADMIN_PASSWORD are not set for this environment, so nobody can sign in.");
    return;
  }
  if (password.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters.");

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (!existing) {
    await db.insert(users).values({ email, name: "ESGCounts Admin", role: "admin", jobTitle: "Administrator", passwordHash: await hashPassword(password) });
    console.log(`✓ created admin ${email}`);
  } else if (env("RESET_ADMIN_PASSWORD") === "true") {
    await db.update(users).set({ passwordHash: await hashPassword(password), role: "admin", active: true, updatedAt: new Date() }).where(eq(users.id, existing.id));
    console.log(`✓ reset password for admin ${email}`);
  } else {
    console.log(`✓ admin ${email} exists`);
  }
}

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

  await ensureAdmin(db);
  await client.end();
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
