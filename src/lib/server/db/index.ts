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

let _client: Sql | null = null;
let _db: Db | null = null;

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
	if (_db) return _db;
	if (!_client) {
		_client = postgres(ensureUrl(), { max: 10, onnotice: () => {} });
	}
	_db = drizzle(_client, { schema });
	return _db;
}

/**
 * Test-Helper: Connection schließen (z.B. nach Migrations- oder Integration-Test).
 */
export async function closeDb(): Promise<void> {
	if (_client) {
		await _client.end();
		_client = null;
		_db = null;
	}
}

export { schema };
