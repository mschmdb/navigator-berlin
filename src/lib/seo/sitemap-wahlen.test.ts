import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getWahlList = vi.fn();
vi.mock('$lib/server/db/queries/wahl/get-wahl-list.js', () => ({
	getWahlList: (...args: unknown[]) => getWahlList(...args)
}));

import { loadWahlenForSitemap } from './sitemap-wahlen.js';

const row = {
	jahr: 2026,
	typ: 'bvv' as const,
	stimmtyp: 'einstimme' as const,
	sourceUpdatedAt: new Date('2026-09-20T23:55:55.000Z')
};

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	getWahlList.mockReset();
	warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
	vi.unstubAllEnvs();
	warn.mockRestore();
});

describe('loadWahlenForSitemap', () => {
	it('mappt DB-Zeilen und serialisiert sourceUpdatedAt als ISO-String', async () => {
		vi.stubEnv('DATABASE_URL', 'postgres://test/test');
		getWahlList.mockResolvedValue([row, { ...row, jahr: 2025, sourceUpdatedAt: null }]);
		expect(await loadWahlenForSitemap()).toEqual([
			{
				jahr: 2026,
				typ: 'bvv',
				stimmtyp: 'einstimme',
				sourceUpdatedAt: '2026-09-20T23:55:55.000Z'
			},
			{ jahr: 2025, typ: 'bvv', stimmtyp: 'einstimme', sourceUpdatedAt: null }
		]);
		expect(warn).not.toHaveBeenCalled();
	});

	describe('strikter Build (NAVIGATOR_STRICT_BUILD=1)', () => {
		beforeEach(() => {
			vi.stubEnv('NAVIGATOR_STRICT_BUILD', '1');
		});

		it('wirft ohne DATABASE_URL', async () => {
			vi.stubEnv('DATABASE_URL', '');
			await expect(loadWahlenForSitemap()).rejects.toThrow(/DATABASE_URL/);
			expect(getWahlList).not.toHaveBeenCalled();
		});

		it('wirft bei DB-Fehler mit Fehlercode, ohne die Fehlermeldung zu übernehmen', async () => {
			vi.stubEnv('DATABASE_URL', 'postgres://user:geheim@host/db');
			getWahlList.mockRejectedValue(
				Object.assign(new Error('password authentication failed for user geheim'), {
					code: 'ECONNREFUSED'
				})
			);
			const failure = loadWahlenForSitemap();
			await expect(failure).rejects.toThrow(/ECONNREFUSED/);
			await expect(failure).rejects.not.toThrow(/geheim/);
		});

		it('nutzt err.name, wenn kein code existiert', async () => {
			vi.stubEnv('DATABASE_URL', 'postgres://test/test');
			getWahlList.mockRejectedValue(new TypeError('secret detail'));
			const failure = loadWahlenForSitemap();
			await expect(failure).rejects.toThrow(/TypeError/);
			await expect(failure).rejects.not.toThrow(/secret detail/);
		});

		it('wirft bei leerer Wahl-Liste', async () => {
			vi.stubEnv('DATABASE_URL', 'postgres://test/test');
			getWahlList.mockResolvedValue([]);
			await expect(loadWahlenForSitemap()).rejects.toThrow(/keine Wahl-Daten/);
		});
	});

	describe('NODE_ENV=production ohne Flag (lokaler vite build)', () => {
		it('warnt nur und liefert []', async () => {
			vi.stubEnv('NODE_ENV', 'production');
			vi.stubEnv('NAVIGATOR_STRICT_BUILD', '');
			vi.stubEnv('DATABASE_URL', '');
			expect(await loadWahlenForSitemap()).toEqual([]);
			expect(warn).toHaveBeenCalledTimes(1);
		});
	});

	describe('lokaler Build', () => {
		beforeEach(() => {
			vi.stubEnv('NAVIGATOR_STRICT_BUILD', '');
		});

		it('warnt laut und liefert [] ohne DATABASE_URL', async () => {
			vi.stubEnv('DATABASE_URL', '');
			expect(await loadWahlenForSitemap()).toEqual([]);
			expect(warn).toHaveBeenCalledTimes(1);
			expect(String(warn.mock.calls[0][0])).toMatch(/DATABASE_URL/);
		});

		it('warnt und liefert [] bei DB-Fehler, ohne die Meldung zu loggen', async () => {
			vi.stubEnv('DATABASE_URL', 'postgres://test/test');
			getWahlList.mockRejectedValue(new Error('connection refused to secret-host'));
			expect(await loadWahlenForSitemap()).toEqual([]);
			expect(warn).toHaveBeenCalledTimes(1);
			expect(String(warn.mock.calls[0][0])).toMatch(/Error/);
			expect(String(warn.mock.calls[0][0])).not.toMatch(/secret-host/);
		});

		it('leere Wahl-Liste liefert [] mit genau einer Warnung', async () => {
			vi.stubEnv('DATABASE_URL', 'postgres://test/test');
			getWahlList.mockResolvedValue([]);
			expect(await loadWahlenForSitemap()).toEqual([]);
			expect(warn).toHaveBeenCalledTimes(1);
		});
	});
});
