import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function main(): Promise<void> {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error('DATABASE_URL ist nicht gesetzt. Siehe .env.example.');
	}
	const client = postgres(url, { max: 1, onnotice: () => {} });
	const db = drizzle(client);
	console.log('[db:migrate] applying migrations…');
	await migrate(db, { migrationsFolder: './drizzle/migrations' });
	console.log('[db:migrate] done.');
	await client.end();
}

main().catch((err) => {
	console.error('[db:migrate] failed:', err);
	process.exit(1);
});
