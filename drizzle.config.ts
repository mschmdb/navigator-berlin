import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL ist nicht gesetzt. Siehe .env.example.');
}

export default defineConfig({
	schema: './src/lib/server/db/schema/index.ts',
	out: './drizzle/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL
	},
	strict: true,
	verbose: false
});
