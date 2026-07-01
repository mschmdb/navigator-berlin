import { beforeEach, describe, expect, it } from 'vitest';
import {
	parseBerlinHeatWarning,
	fetchBerlinHeatWarning,
	ecToLevel,
	levelLabel,
	_resetDwdCache
} from './dwd-warnings.js';

function fc(features: Array<{ NAME: string; EC_II: number; HEADLINE?: string }>) {
	return {
		type: 'FeatureCollection',
		features: features.map((p) => ({ type: 'Feature', geometry: null, properties: p }))
	};
}

beforeEach(() => _resetDwdCache());

describe('ecToLevel / levelLabel', () => {
	it('mappt 247/248 auf Stufen, sonst null', () => {
		expect(ecToLevel(247)).toBe('stark');
		expect(ecToLevel(248)).toBe('extrem');
		expect(ecToLevel(246)).toBeNull();
		expect(ecToLevel(0)).toBeNull();
	});
	it('Stufen-Label', () => {
		expect(levelLabel('stark')).toBe('Starke Hitze');
		expect(levelLabel('extrem')).toBe('Extreme Hitze');
	});
});

describe('parseBerlinHeatWarning', () => {
	it('Berlin starke Hitze (247)', () => {
		const w = parseBerlinHeatWarning(
			fc([{ NAME: 'Stadt Berlin', EC_II: 247, HEADLINE: 'Amtliche Warnung vor starker Hitze' }])
		);
		expect(w).toEqual({
			level: 'stark',
			label: 'Starke Hitze',
			headline: 'Amtliche Warnung vor starker Hitze',
			source: 'Deutscher Wetterdienst (DWD)',
			sourceUrl: expect.stringContaining('dwd.de')
		});
	});

	it('Berlin extreme Hitze (248)', () => {
		const w = parseBerlinHeatWarning(fc([{ NAME: 'Stadt Berlin', EC_II: 248 }]));
		expect(w?.level).toBe('extrem');
		expect(w?.label).toBe('Extreme Hitze');
		// Fallback-Headline = Label, wenn HEADLINE fehlt
		expect(w?.headline).toBe('Extreme Hitze');
	});

	it('mehrere Berlin-Warnungen: höchste Stufe gewinnt', () => {
		const w = parseBerlinHeatWarning(
			fc([
				{ NAME: 'Stadt Berlin', EC_II: 247 },
				{ NAME: 'Stadt Berlin', EC_II: 248 }
			])
		);
		expect(w?.level).toBe('extrem');
	});

	it('anderer Bezirk ohne Berlin-Bezug → null', () => {
		expect(parseBerlinHeatWarning(fc([{ NAME: 'Stadt Hamburg', EC_II: 248 }]))).toBeNull();
	});

	it('leere FeatureCollection → null', () => {
		expect(parseBerlinHeatWarning(fc([]))).toBeNull();
	});

	it('unpassende Struktur → null', () => {
		expect(parseBerlinHeatWarning(null)).toBeNull();
		expect(parseBerlinHeatWarning({})).toBeNull();
		expect(parseBerlinHeatWarning({ features: 'nope' })).toBeNull();
	});
});

describe('fetchBerlinHeatWarning (Degradation)', () => {
	const okFetch = (body: unknown): typeof fetch =>
		(async () => ({ ok: true, json: async () => body })) as unknown as typeof fetch;

	it('gültige Warnlage → HeatWarning', async () => {
		const w = await fetchBerlinHeatWarning(okFetch(fc([{ NAME: 'Stadt Berlin', EC_II: 248 }])));
		expect(w?.level).toBe('extrem');
	});

	it('HTTP-Fehler → null', async () => {
		const f = (async () => ({ ok: false })) as unknown as typeof fetch;
		expect(await fetchBerlinHeatWarning(f)).toBeNull();
	});

	it('Netzwerk-/Abort-Fehler → null', async () => {
		const f = (async () => {
			throw new Error('abort');
		}) as unknown as typeof fetch;
		expect(await fetchBerlinHeatWarning(f)).toBeNull();
	});

	it('unparsbarer Body → null', async () => {
		const f = (async () => ({
			ok: true,
			json: async () => {
				throw new Error('bad json');
			}
		})) as unknown as typeof fetch;
		expect(await fetchBerlinHeatWarning(f)).toBeNull();
	});

	it('keine Warnung → null', async () => {
		expect(await fetchBerlinHeatWarning(okFetch(fc([])))).toBeNull();
	});
});

describe('fetchBerlinHeatWarning (Negativ-Cache bei Ausfall)', () => {
	it('HTTP-Fehler wird gecacht: zweiter Aufruf ohne erneuten Fetch', async () => {
		let calls = 0;
		const f = (async () => {
			calls++;
			return { ok: false };
		}) as unknown as typeof fetch;
		expect(await fetchBerlinHeatWarning(f)).toBeNull();
		expect(await fetchBerlinHeatWarning(f)).toBeNull();
		expect(calls).toBe(1);
	});

	it('Netzwerkfehler wird gecacht: zweiter Aufruf ohne erneuten Fetch', async () => {
		let calls = 0;
		const f = (async () => {
			calls++;
			throw new Error('abort');
		}) as unknown as typeof fetch;
		await fetchBerlinHeatWarning(f);
		await fetchBerlinHeatWarning(f);
		expect(calls).toBe(1);
	});

	it('nach Cache-Reset wird erneut versucht', async () => {
		let calls = 0;
		const f = (async () => {
			calls++;
			return { ok: false };
		}) as unknown as typeof fetch;
		await fetchBerlinHeatWarning(f);
		_resetDwdCache();
		await fetchBerlinHeatWarning(f);
		expect(calls).toBe(2);
	});
});
