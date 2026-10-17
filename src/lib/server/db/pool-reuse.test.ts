import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// #145: Vite wertet das Modul bei HMR neu aus. Der Pool muss das überleben,
// sonst öffnet jede Neuauswertung einen weiteren Pool mit bis zu 10 Verbindungen.
const postgresMock = vi.fn(() => ({ end: vi.fn(async () => {}) }));

vi.mock('postgres', () => ({ default: postgresMock }));
const drizzleMock = vi.fn((client: unknown) => ({ client }));
vi.mock('drizzle-orm/postgres-js', () => ({ drizzle: drizzleMock }));

describe('db/index Pool über Modul-Neuauswertung (#145)', () => {
	beforeEach(async () => {
		process.env.DATABASE_URL = 'postgres://app:app@127.0.0.1:5432/navigator_dev';
		postgresMock.mockClear();
		vi.resetModules();
		const mod = await import('./index.js');
		await mod.closeDb();
		postgresMock.mockClear();
	});

	afterEach(async () => {
		const mod = await import('./index.js');
		await mod.closeDb();
	});

	it('öffnet nach erneutem Import keinen zweiten Pool', { timeout: 20_000 }, async () => {
		const first = await import('./index.js');
		const db1 = first.getDb();

		vi.resetModules();
		const second = await import('./index.js');
		const db2 = second.getDb();

		expect(postgresMock).toHaveBeenCalledTimes(1);
		// Gleicher Pool, aber ein frischer Drizzle-Wrapper: so greift ein
		// per HMR geändertes Schema sofort (Codex-Review #145).
		expect((db2 as unknown as { client: unknown }).client).toBe(
			(db1 as unknown as { client: unknown }).client
		);
		expect(db2).not.toBe(db1);
	});

	it(
		'closeDb() schließt den geteilten Pool und erlaubt einen neuen',
		{ timeout: 20_000 },
		async () => {
			const mod = await import('./index.js');
			mod.getDb();
			await mod.closeDb();

			vi.resetModules();
			const again = await import('./index.js');
			again.getDb();

			expect(postgresMock).toHaveBeenCalledTimes(2);
		}
	);
});
