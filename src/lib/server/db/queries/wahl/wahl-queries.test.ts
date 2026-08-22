import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeDb } from '../../index.js';
import { getWahlList } from './get-wahl-list.js';
import { getResultsForStimmbezirk } from './get-results-for-stimmbezirk.js';
import { getResultsForKiez } from './get-results-for-kiez.js';
import { getResultsForBezirk } from './get-results-for-bezirk.js';
import { getResultsForBerlin } from './get-results-for-berlin.js';
import { getSparklineForKiez } from './get-sparkline-for-kiez.js';
import { getKiezSharesForWahl } from './get-kiez-shares-for-wahl.js';

afterAll(async () => {
	await closeDb();
});

describe('Wahl-Queries (Story 6.0 AC-6)', () => {
	describe('graceful fallback without DATABASE_URL', () => {
		const originalUrl = process.env.DATABASE_URL;
		beforeAll(() => {
			delete process.env.DATABASE_URL;
		});

		it('getWahlList returns empty when DATABASE_URL missing', async () => {
			expect(await getWahlList()).toEqual([]);
		});

		it('getResultsForStimmbezirk returns empty without DB', async () => {
			expect(await getResultsForStimmbezirk(1, '074-01-104-0')).toEqual([]);
		});

		it('getKiezSharesForWahl returns empty without DB', async () => {
			expect(await getKiezSharesForWahl(1)).toEqual([]);
		});

		it('getResultsForKiez returns empty without DB', async () => {
			expect(await getResultsForKiez(1, 'mitte-zentrum')).toEqual([]);
		});

		it('getResultsForBezirk returns empty without DB', async () => {
			expect(await getResultsForBezirk(1, 'mitte')).toEqual([]);
		});

		it('getResultsForBerlin returns empty without DB', async () => {
			expect(await getResultsForBerlin(1)).toEqual([]);
		});

		it('getSparklineForKiez returns empty without DB', async () => {
			expect(await getSparklineForKiez('mitte-zentrum', 'btw')).toEqual([]);
		});

		afterAll(() => {
			if (originalUrl) process.env.DATABASE_URL = originalUrl;
		});
	});

	describe('snapshot against local Postgres (requires pnpm data:wahl-fetch ran)', () => {
		beforeAll(() => {
			process.env.DATABASE_URL =
				process.env.DATABASE_URL ?? 'postgres://app:app@127.0.0.1:5432/navigator_dev';
		});

		it('getWahlList enthält BTW25 Erst + Zweit', async () => {
			const list = await getWahlList();
			const btw25 = list.filter((w) => w.jahr === 2025 && w.typ === 'btw');
			expect(btw25.length).toBeGreaterThanOrEqual(2);
			expect(btw25.map((w) => w.stimmtyp).sort()).toContain('erststimme');
			expect(btw25.map((w) => w.stimmtyp).sort()).toContain('zweitstimme');
		});

		it('getResultsForBerlin liefert Top-5 mit Anteilen', async () => {
			const list = await getWahlList();
			const btw25Zweit = list.find((w) => w.jahr === 2025 && w.stimmtyp === 'zweitstimme');
			if (!btw25Zweit) return;
			const top5 = await getResultsForBerlin(btw25Zweit.id, 5);
			expect(top5.length).toBe(5);
			expect(top5[0].stimmen).toBeGreaterThan(top5[1].stimmen);
			expect(top5[0].anteil).toBeGreaterThan(0);
			expect(top5[0].anteil).toBeLessThan(1);
			expect(top5[0].farbeHex).toMatch(/^#[0-9A-F]{6}$/i);
		});

		it('getResultsForBezirk liefert Mitte-Result', async () => {
			const list = await getWahlList();
			const btw25Zweit = list.find((w) => w.jahr === 2025 && w.stimmtyp === 'zweitstimme');
			if (!btw25Zweit) return;
			const top = await getResultsForBezirk(btw25Zweit.id, 'mitte', 5);
			expect(top.length).toBeGreaterThan(0);
			expect(top.length).toBeLessThanOrEqual(5);
		});

		it('getResultsForStimmbezirk liefert echte UWB-Daten', async () => {
			const list = await getWahlList();
			const btw25Erst = list.find((w) => w.jahr === 2025 && w.stimmtyp === 'erststimme');
			if (!btw25Erst) return;
			const top = await getResultsForStimmbezirk(btw25Erst.id, '074-01-104-0', 5);
			expect(top.length).toBeGreaterThan(0);
		});

		it('getResultsForKiez ist leer solange Story 6.2 noch keine Geometrien hat', async () => {
			const list = await getWahlList();
			const btw25Zweit = list.find((w) => w.jahr === 2025 && w.stimmtyp === 'zweitstimme');
			if (!btw25Zweit) return;
			const top = await getResultsForKiez(btw25Zweit.id, 'mitte-zentrum', 5);
			expect(top).toEqual([]);
		});
	});
});
