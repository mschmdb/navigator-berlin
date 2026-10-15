import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { closeDb } from '../../index.js';
import { getWahlList } from './get-wahl-list.js';
import { getResultsForStimmbezirk } from './get-results-for-stimmbezirk.js';
import { getResultsForKiez } from './get-results-for-kiez.js';
import { getResultsForBezirk } from './get-results-for-bezirk.js';
import { getResultsForBerlin } from './get-results-for-berlin.js';
import { getSparklineForKiez } from './get-sparkline-for-kiez.js';
import { getKiezSharesForWahl } from './get-kiez-shares-for-wahl.js';
import { getSeriesForGebiet } from './get-series-for-gebiet.js';
import { getWinnersBulk } from './get-winners-bulk.js';
import { getAnalytikForReihe, getTrendForReihe } from './get-analytik-for-reihe.js';
import { getParteiAnteileBulk, getParteiAnteileStimmbezirk } from './get-partei-anteile-bulk.js';
import { getStimmbezirksWinners } from './get-stimmbezirks-winners.js';

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
			expect(await getResultsForStimmbezirk(1, '074-01-104-0')).toEqual({
				gruppeId: null,
				results: []
			});
		});

		it('getStimmbezirksWinners returns empty without DB', async () => {
			expect(await getStimmbezirksWinners(1)).toEqual([]);
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

		it('getSeriesForGebiet returns empty without DB', async () => {
			expect(await getSeriesForGebiet('mitte-zentrum', 'kiez', 'agh', 'zweitstimme')).toEqual([]);
		});

		it('getSeriesForGebiet (ebene berlin) returns empty without DB', async () => {
			expect(await getSeriesForGebiet(null, 'berlin', 'agh', 'zweitstimme')).toEqual([]);
		});

		it('getWinnersBulk returns empty without DB', async () => {
			expect(await getWinnersBulk('kiez', 'agh', 'zweitstimme')).toEqual([]);
		});

		it('getParteiAnteileBulk returns empty without DB', async () => {
			expect(await getParteiAnteileBulk('kiez', 'agh', 'zweitstimme', 'CDU')).toEqual([]);
		});

		it('getParteiAnteileStimmbezirk returns empty without DB', async () => {
			expect(await getParteiAnteileStimmbezirk(1, 'CDU')).toEqual([]);
		});

		it('getAnalytikForReihe returns empty without DB', async () => {
			expect(await getAnalytikForReihe('agh', 'zweitstimme')).toEqual([]);
		});

		it('getTrendForReihe returns empty without DB', async () => {
			expect(await getTrendForReihe('agh', 'zweitstimme')).toEqual([]);
		});

		afterAll(() => {
			if (originalUrl) process.env.DATABASE_URL = originalUrl;
		});
	});

	describe.skipIf(!process.env.DATABASE_URL)(
		'snapshot against local Postgres (requires pnpm data:wahl-fetch ran)',
		() => {
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
				if (!btw25Zweit) throw new Error('Testdaten fehlen: btw25Zweit (pnpm data:wahl-fetch)');
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
				if (!btw25Zweit) throw new Error('Testdaten fehlen: btw25Zweit (pnpm data:wahl-fetch)');
				const top = await getResultsForBezirk(btw25Zweit.id, 'mitte', 5);
				expect(top.length).toBeGreaterThan(0);
				expect(top.length).toBeLessThanOrEqual(5);
			});

			it('getResultsForStimmbezirk liefert die Gruppen-Summe (Urne + Briefwahl) für eine echte Urne (Story 17)', async () => {
				const list = await getWahlList();
				const btw25Erst = list.find((w) => w.jahr === 2025 && w.stimmtyp === 'erststimme');
				if (!btw25Erst) throw new Error('Testdaten fehlen: btw25Erst (pnpm data:wahl-fetch)');
				const top = await getResultsForStimmbezirk(btw25Erst.id, '074-01-104-0', 5);
				expect(top.results.length).toBeGreaterThan(0);
				expect(top.gruppeId).not.toBeNull();
				expect(top.results.length).toBeGreaterThan(0);
			});

			it('getStimmbezirksWinners löst Gleichstand deterministisch alphabetisch nach Partei-Kurzname (Review-Fund, AGH26 Gruppe 03B3F: AfD=Linke=325)', async () => {
				const list = await getWahlList();
				const agh26Zweit = list.find(
					(w) => w.jahr === 2026 && w.typ === 'agh' && w.stimmtyp === 'zweitstimme'
				);
				if (!agh26Zweit) throw new Error('Testdaten fehlen: agh26Zweit (pnpm data:wahl-fetch)');
				const winners = await getStimmbezirksWinners(agh26Zweit.id);
				expect(winners.length).toBeGreaterThan(0);
				const gruppe03B3F = winners.find((w) => w.gruppeId === '03B3F');
				if (!gruppe03B3F) throw new Error('Testdaten fehlen: gruppe03B3F (pnpm data:wahl-fetch)');
				// AfD < Die Linke < ... alphabetisch bei gleicher Stimmenzahl (325).
				expect(gruppe03B3F.parteiKurzname).toBe('AfD');
			});

			it('getResultsForKiez ist leer solange Story 6.2 noch keine Geometrien hat', async () => {
				const list = await getWahlList();
				const btw25Zweit = list.find((w) => w.jahr === 2025 && w.stimmtyp === 'zweitstimme');
				if (!btw25Zweit) throw new Error('Testdaten fehlen: btw25Zweit (pnpm data:wahl-fetch)');
				const top = await getResultsForKiez(btw25Zweit.id, 'mitte-zentrum', 5);
				expect(top).toEqual([]);
			});

			it('getSeriesForGebiet liefert eine Zeitreihe für einen echten Kiez', async () => {
				const rows = await getSeriesForGebiet('adlershof', 'kiez', 'agh', 'zweitstimme');
				expect(rows.length).toBeGreaterThan(0);
				const jahre = new Set(rows.map((r) => r.jahr));
				expect(jahre.size).toBeGreaterThan(1);
				expect(rows[0].anteil).toBeGreaterThan(0);
			});

			it('getSeriesForGebiet (ebene berlin) liefert die AGH-Zeitreihe für Berlin gesamt, Anteile 0..1', async () => {
				const rows = await getSeriesForGebiet(null, 'berlin', 'agh', 'zweitstimme');
				expect(rows.length).toBeGreaterThan(0);
				const jahre = new Set(rows.map((r) => r.jahr));
				expect(jahre.size).toBeGreaterThan(1);
				for (const r of rows) {
					expect(r.anteil).toBeGreaterThan(0);
					expect(r.anteil).toBeLessThan(1);
				}
				const cdu2023 = rows.find((r) => r.jahr === 2023 && r.parteiKurzname === 'CDU');
				if (cdu2023) expect(cdu2023.anteil).toBeCloseTo(0.282, 2);
			});

			it('getWinnersBulk liefert eine Row pro Jahr × Gebiet', async () => {
				const rows = await getWinnersBulk('kiez', 'agh', 'zweitstimme');
				expect(rows.length).toBeGreaterThan(0);
				const key = `${rows[0].wahlId}-${rows[0].gebietSlug}`;
				const dupes = rows.filter((r) => `${r.wahlId}-${r.gebietSlug}` === key);
				expect(dupes.length).toBe(1);
			});

			it('getParteiAnteileBulk liefert nur die angefragte Partei, anteil 0..1 (AGH CDU-Berlin ≈ 0,282 in 2023)', async () => {
				const rows = await getParteiAnteileBulk('bezirk', 'agh', 'zweitstimme', 'CDU');
				expect(rows.length).toBeGreaterThan(0);
				expect(rows.every((r) => r.parteiKurzname === 'CDU')).toBe(true);
				for (const r of rows) {
					expect(r.anteil).toBeGreaterThanOrEqual(0);
					expect(r.anteil).toBeLessThan(1);
				}
				// Berlin-Bezirks-Aggregat existiert nicht als eigene Row -- Referenz
				// bleibt qualitativ (Muster oben, getSeriesForGebiet-Anker), hier nur
				// die Partei-Filterung + Wertebereich als Bauplan-Treue prüfen.
			});

			it('getParteiAnteileStimmbezirk liefert nur die angefragte Partei je Briefwahl-Gruppe (Story 17)', async () => {
				const list = await getWahlList();
				const agh23 = list.find(
					(w) => w.jahr === 2023 && w.typ === 'agh' && w.stimmtyp === 'zweitstimme'
				);
				if (!agh23) throw new Error('Testdaten fehlen: agh23 (pnpm data:wahl-fetch)');
				const rows = await getParteiAnteileStimmbezirk(agh23.id, 'CDU');
				expect(rows.length).toBeGreaterThan(0);
				expect(rows.every((r) => r.parteiKurzname === 'CDU')).toBe(true);
				expect(rows[0].gruppeId).toMatch(/^\d{2}B\S+$/);
			});

			it('getAnalytikForReihe + getTrendForReihe liefern konsistente Kiez-Slugs (nach build-wahl-analytik)', async () => {
				const [analytik, trend] = await Promise.all([
					getAnalytikForReihe('agh', 'zweitstimme'),
					getTrendForReihe('agh', 'zweitstimme')
				]);
				expect(analytik.length).toBeGreaterThan(0);
				const analytikSlugs = new Set(analytik.map((a) => a.kiezSlug));
				expect(trend.some((t) => analytikSlugs.has(t.kiezSlug))).toBe(true);
				expect(analytik[0].wechselCount).toBeGreaterThanOrEqual(0);
				expect(Array.isArray(analytik[0].wechselJahre)).toBe(true);
			});
		}
	);
});
