import { describe, it, expect, afterEach, beforeEach } from 'vitest';

describe('db/index lazy connection (Story 2.0 AC-3)', () => {
	const originalUrl = process.env.DATABASE_URL;

	afterEach(() => {
		if (originalUrl === undefined) {
			delete process.env.DATABASE_URL;
		} else {
			process.env.DATABASE_URL = originalUrl;
		}
	});

	// Erst-Import transformiert drizzle + pg + Schema; unter Suite-Volllast
	// (Chromium-Projekt parallel) dauert das gelegentlich über 5 s. Der lange
	// Timeout deckt die Transform-Zeit, nicht die Logik.
	it('module imports without DATABASE_URL set (lazy)', { timeout: 20_000 }, async () => {
		delete process.env.DATABASE_URL;
		// Import must succeed even when env var missing — connection is deferred.
		await expect(import('./index.js')).resolves.toBeDefined();
	});

	it(
		'getDb() throws clear German error when DATABASE_URL missing',
		{ timeout: 20_000 },
		async () => {
			delete process.env.DATABASE_URL;
			const mod = await import('./index.js');
			// closeDb first to reset state from prior tests
			await mod.closeDb();
			expect(() => mod.getDb()).toThrow(/DATABASE_URL ist nicht gesetzt/);
		}
	);
});

describe('db/index server-only boundary (Story 2.0 AC-3)', () => {
	beforeEach(() => {
		process.env.DATABASE_URL = 'postgres://app:app@127.0.0.1:5432/navigator_dev';
	});

	it('module path lives under $lib/server (not $lib/db)', { timeout: 20_000 }, async () => {
		// Boundary smoke: SvelteKit gates $lib/server/** from client imports.
		// We verify the module is importable from a server-context test file.
		const { getDb, closeDb, schema } = await import('./index.js');
		expect(typeof getDb).toBe('function');
		expect(typeof closeDb).toBe('function');
		expect(schema.bezirkStats).toBeDefined();
		expect(schema.kiezStats).toBeDefined();
		await closeDb();
	});
});
