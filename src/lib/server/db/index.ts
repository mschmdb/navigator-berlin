import 'dotenv/config';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema/index.js';

/**
 * Lazy-Connection-Pool für Postgres (Story 2.0).
 *
 * `getDb()` öffnet die Connection erst beim ersten Aufruf, nicht beim Modul-Import.
 * Grund: `pnpm data:fetch` und andere Build-Schritte importieren möglicherweise
 * indirekt Server-Code; ohne Lazy-Init würden sie ohne `DATABASE_URL` brechen.
 *
 * Boundary: Dieses Modul lebt unter `$lib/server/`. SvelteKit verifiziert
 * zur Build-Zeit, dass Client-Code (`$lib/components/`, `+page.svelte`)
 * keine `$lib/server/`-Module importiert.
 */

export type Db = PostgresJsDatabase<typeof schema>;

/**
 * Pool auf `globalThis` statt in Modul-Variablen (#145): Vite wertet dieses
 * Modul bei HMR neu aus. Mit Modul-Variablen entstand bei jedem Reload ein
 * neuer Pool (max 10), der alte blieb offen, bis Postgres keine Verbindung
 * mehr annahm. In Prod läuft das Modul einmal, dort ändert sich nichts.
 */
type DbCache = { client: Sql | null; db: Db | null };

declare global {
	var __navigatorDbCache: DbCache | undefined;
}

function cache(): DbCache {
	globalThis.__navigatorDbCache ??= { client: null, db: null };
	return globalThis.__navigatorDbCache;
}

function ensureUrl(): string {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error('DATABASE_URL ist nicht gesetzt. Siehe .env.example.');
	}
	return url;
}

/**
 * Liefert den Singleton-Drizzle-Client (lazy-initialisiert).
 */
export function getDb(): Db {
	const c = cache();
	if (c.db) return c.db;
	if (!c.client) {
		c.client = postgres(ensureUrl(), { max: 10, onnotice: () => {} });
	}
	c.db = drizzle(c.client, { schema });
	return c.db;
}

/**
 * Test-Helper: Connection schließen (z.B. nach Migrations- oder Integration-Test).
 */
export async function closeDb(): Promise<void> {
	const c = cache();
	if (c.client) {
		const client = c.client;
		c.client = null;
		c.db = null;
		await client.end();
	}
}

export { schema };
