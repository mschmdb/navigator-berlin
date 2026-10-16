import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	COLD_EVENT_CODES,
	ecToColdEvent,
	fetchBerlinColdWarnings,
	parseBerlinColdWarnings,
	_resetDwdColdCache
} from './dwd-kaelte-warnings.js';

interface Props {
	NAME: string;
	EC_II: number;
	HEADLINE?: string;
	WARNCELLID?: number;
	ONSET?: string;
	EXPIRES?: string;
}

function fc(features: Props[]) {
	return {
		type: 'FeatureCollection',
		features: features.map((p) => ({ type: 'Feature', geometry: null, properties: p }))
	};
}

const BERLIN = { NAME: 'Stadt Berlin', WARNCELLID: 811000000 };

beforeEach(() => _resetDwdColdCache());
afterEach(() => vi.useRealTimers());

describe('ecToColdEvent', () => {
	it.each([
		[82, 'strenger-frost', 2],
		[87, 'markante-glaette', 2],
		[85, 'glatteis', 3],
		[86, 'extremes-glatteis', 4],
		[71, 'schneefall', 2],
		[72, 'starker-schneefall', 3],
		[73, 'extrem-starker-schneefall', 4],
		[74, 'schneeverwehung', 2],
		[75, 'starke-schneeverwehung', 3],
		[76, 'extrem-starke-schneeverwehung', 4]
	])('EC %i -> %s (Stufe %i)', (ec, event, level) => {
		expect(ecToColdEvent(ec)).toMatchObject({ event, level });
	});

	it.each([22, 84, 70, 88, 89, 247, 248, 0, NaN])('EC %s liefert null', (ec) => {
		expect(ecToColdEvent(ec)).toBeNull();
	});

	it('Code-Liste enthält genau die zehn Stufe-2-bis-4-Codes', () => {
		expect([...COLD_EVENT_CODES].sort((a, b) => a - b)).toEqual([
			71, 72, 73, 74, 75, 76, 82, 85, 86, 87
		]);
	});
});

describe('parseBerlinColdWarnings', () => {
	it('eine Warnung: Strenger Frost mit DWD-Headline und Quelle', () => {
		const w = parseBerlinColdWarnings(
			fc([{ ...BERLIN, EC_II: 82, HEADLINE: 'Amtliche WARNUNG vor strengem Frost' }])
		);
		expect(w).toEqual([
			{
				event: 'strenger-frost',
				level: 2,
				headline: 'Amtliche WARNUNG vor strengem Frost',
				source: 'Deutscher Wetterdienst (DWD)',
				sourceUrl: 'https://www.dwd.de/warnungen'
			}
		]);
	});

	it('fehlende, leere oder blanke HEADLINE ergibt null, sonst getrimmt', () => {
		const w = (headline?: string) =>
			parseBerlinColdWarnings(fc([{ ...BERLIN, EC_II: 85, HEADLINE: headline }]))[0]?.headline;
		expect(w(undefined)).toBeNull();
		expect(w('')).toBeNull();
		expect(w('   ')).toBeNull();
		expect(w('  Text  ')).toBe('Text');
	});

	it('gleiche Familie: 85+86 zeigt nur Extremes Glatteis', () => {
		const w = parseBerlinColdWarnings(
			fc([
				{ ...BERLIN, EC_II: 85 },
				{ ...BERLIN, EC_II: 86 }
			])
		);
		expect(w.map((x) => x.event)).toEqual(['extremes-glatteis']);
	});

	it('gleiche Familie: 71+72 zeigt nur Starker Schneefall, 74-76 nur die höchste Verwehung', () => {
		const w = parseBerlinColdWarnings(
			fc([
				{ ...BERLIN, EC_II: 71 },
				{ ...BERLIN, EC_II: 72 },
				{ ...BERLIN, EC_II: 76 },
				{ ...BERLIN, EC_II: 74 }
			])
		);
		expect(w.map((x) => x.event)).toEqual(['extrem-starke-schneeverwehung', 'starker-schneefall']);
	});

	it('mehrere Warnungen: höchste Stufe zuerst', () => {
		const w = parseBerlinColdWarnings(
			fc([
				{ ...BERLIN, EC_II: 82 },
				{ ...BERLIN, EC_II: 85 }
			])
		);
		expect(w.map((x) => [x.event, x.level])).toEqual([
			['glatteis', 3],
			['strenger-frost', 2]
		]);
	});

	it('Dubletten (Gemeinde und Kreis): Ereignis nur einmal', () => {
		const w = parseBerlinColdWarnings(
			fc([
				{ NAME: 'Stadt Berlin', WARNCELLID: 811000000, EC_II: 82, HEADLINE: 'erste' },
				{ NAME: 'Berlin', WARNCELLID: 111000000, EC_II: 82, HEADLINE: 'zweite' }
			])
		);
		expect(w).toHaveLength(1);
		expect(w[0]?.headline).toBe('erste');
	});

	it('Stufe 1 (22, 84, 70) löst nichts aus', () => {
		const w = parseBerlinColdWarnings(
			fc([
				{ ...BERLIN, EC_II: 22 },
				{ ...BERLIN, EC_II: 84 },
				{ ...BERLIN, EC_II: 70 }
			])
		);
		expect(w).toEqual([]);
	});

	it('Hitzecode 247 und Tauwetter 88/89 zählen nicht', () => {
		const w = parseBerlinColdWarnings(
			fc([
				{ ...BERLIN, EC_II: 247 },
				{ ...BERLIN, EC_II: 88 },
				{ ...BERLIN, EC_II: 89 }
			])
		);
		expect(w).toEqual([]);
	});

	it('andere Region (Überlingen) zählt nicht', () => {
		const w = parseBerlinColdWarnings(
			fc([{ NAME: 'Stadt Überlingen', WARNCELLID: 808435059, EC_II: 82 }])
		);
		expect(w).toEqual([]);
	});

	it('ONSET am nächsten Berliner Tag zählt nicht', () => {
		const now = new Date('2026-12-08T11:00:00Z');
		const w = parseBerlinColdWarnings(
			fc([
				{ ...BERLIN, EC_II: 82, ONSET: '2026-12-09T09:00:00Z', EXPIRES: '2026-12-09T17:00:00Z' }
			]),
			now
		);
		expect(w).toEqual([]);
	});

	it('ONSET später am selben Tag zählt', () => {
		const now = new Date('2026-12-08T06:00:00Z');
		const w = parseBerlinColdWarnings(
			fc([
				{ ...BERLIN, EC_II: 82, ONSET: '2026-12-08T09:00:00Z', EXPIRES: '2026-12-08T17:00:00Z' }
			]),
			now
		);
		expect(w).toHaveLength(1);
	});

	it('abgelaufene Warnung zählt nicht', () => {
		const now = new Date('2026-12-08T18:00:00Z');
		const w = parseBerlinColdWarnings(
			fc([
				{ ...BERLIN, EC_II: 82, ONSET: '2026-12-08T09:00:00Z', EXPIRES: '2026-12-08T17:00:00Z' }
			]),
			now
		);
		expect(w).toEqual([]);
	});

	it('unpassende Struktur liefert leere Liste', () => {
		expect(parseBerlinColdWarnings(null)).toEqual([]);
		expect(parseBerlinColdWarnings({})).toEqual([]);
		expect(parseBerlinColdWarnings({ features: 'nope' })).toEqual([]);
		expect(parseBerlinColdWarnings(fc([]))).toEqual([]);
	});
});

describe('fetchBerlinColdWarnings', () => {
	const okFetch = (body: unknown): typeof fetch =>
		(async () => ({ ok: true, json: async () => body })) as unknown as typeof fetch;

	it('fragt nur Kälte-Codes für Berlin ab', async () => {
		let url = '';
		const f = (async (u: string) => {
			url = decodeURIComponent(u);
			return { ok: true, json: async () => fc([]) };
		}) as unknown as typeof fetch;
		await fetchBerlinColdWarnings(f);
		expect(url).toContain('EC_II IN(71,72,73,74,75,76,82,85,86,87)');
		expect(url).toContain('WARNCELLID IN(811000000,111000000)');
		expect(url).not.toContain('247');
	});

	it('gültige Warnlage liefert Liste', async () => {
		const w = await fetchBerlinColdWarnings(okFetch(fc([{ ...BERLIN, EC_II: 82 }])));
		expect(w).toHaveLength(1);
	});

	it('keine Warnung liefert leere Liste', async () => {
		expect(await fetchBerlinColdWarnings(okFetch(fc([])))).toEqual([]);
	});

	it('HTTP-Fehler, Netzwerkfehler und kaputtes JSON liefern leere Liste', async () => {
		const http = (async () => ({ ok: false })) as unknown as typeof fetch;
		const net = (async () => {
			throw new Error('abort');
		}) as unknown as typeof fetch;
		const json = (async () => ({
			ok: true,
			json: async () => {
				throw new Error('bad json');
			}
		})) as unknown as typeof fetch;
		expect(await fetchBerlinColdWarnings(http)).toEqual([]);
		_resetDwdColdCache();
		expect(await fetchBerlinColdWarnings(net)).toEqual([]);
		_resetDwdColdCache();
		expect(await fetchBerlinColdWarnings(json)).toEqual([]);
	});

	it('Fehler wird kurz negativ gecacht', async () => {
		let calls = 0;
		const f = (async () => {
			calls++;
			return { ok: false };
		}) as unknown as typeof fetch;
		await fetchBerlinColdWarnings(f);
		await fetchBerlinColdWarnings(f);
		expect(calls).toBe(1);
	});

	it('Treffer wird gecacht', async () => {
		let calls = 0;
		const f = (async () => {
			calls++;
			return { ok: true, json: async () => fc([{ ...BERLIN, EC_II: 82 }]) };
		}) as unknown as typeof fetch;
		await fetchBerlinColdWarnings(f);
		await fetchBerlinColdWarnings(f);
		expect(calls).toBe(1);
	});

	it('gecachte Warnung verschwindet nach EXPIRES ohne neuen Fetch', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-12-08T10:00:00Z'));
		let calls = 0;
		const f = (async () => {
			calls++;
			return {
				ok: true,
				json: async () =>
					fc([
						{ ...BERLIN, EC_II: 82, ONSET: '2026-12-08T08:00:00Z', EXPIRES: '2026-12-08T10:05:00Z' }
					])
			};
		}) as unknown as typeof fetch;
		expect(await fetchBerlinColdWarnings(f)).toHaveLength(1);
		vi.setSystemTime(new Date('2026-12-08T10:06:00Z'));
		expect(await fetchBerlinColdWarnings(f)).toEqual([]);
		expect(calls).toBe(1);
	});

	it('200 ohne features-Array wird wie ein Fehler kurz negativ gecacht', async () => {
		let calls = 0;
		const f = (async () => {
			calls++;
			return { ok: true, json: async () => ({ message: 'maintenance' }) };
		}) as unknown as typeof fetch;
		expect(await fetchBerlinColdWarnings(f)).toEqual([]);
		expect(await fetchBerlinColdWarnings(f)).toEqual([]);
		expect(calls).toBe(1);
	});
});
