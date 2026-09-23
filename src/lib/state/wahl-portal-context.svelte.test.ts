import { describe, expect, it, vi } from 'vitest';
import { mount, unmount } from 'svelte';
import MissingProvider from './wahl-portal-missing-provider.svelte';
import {
	createWahlPortalState,
	getWahlPortalState,
	jahreForReihe,
	currentJahr,
	setReihe,
	setEbene,
	setJahr,
	applyWahlList,
	loadWahlList,
	vorlaeufigStatusFor,
	type WahlPortalState,
	type WahlPortalListEntry
} from './wahl-portal-context.svelte.js';

function makeState(overrides: Partial<WahlPortalState> = {}): WahlPortalState {
	return {
		reihe: 'agh',
		ebene: 'kiez',
		jahrOverride: null,
		wahlen: [],
		status: 'idle',
		...overrides
	};
}

const AGH_2021: WahlPortalListEntry = {
	slug: '2021-agh-zweitstimme',
	jahr: 2021,
	typ: 'agh',
	isRepeatElection: false,
	sourceName: 'Amt für Statistik Berlin-Brandenburg',
	license: 'dl-de/by-2-0',
	vorlaeufig: false,
	sourceUpdatedAt: null
};
const AGH_2023: WahlPortalListEntry = {
	slug: '2023-agh-zweitstimme',
	jahr: 2023,
	typ: 'agh',
	isRepeatElection: true,
	sourceName: 'Amt für Statistik Berlin-Brandenburg',
	license: 'dl-de/by-2-0',
	vorlaeufig: false,
	sourceUpdatedAt: null
};
const BTW_2025: WahlPortalListEntry = {
	slug: '2025-btw-zweitstimme',
	jahr: 2025,
	typ: 'btw',
	isRepeatElection: false,
	sourceName: 'Bundeswahlleiterin',
	license: 'dl-de/by-2-0',
	vorlaeufig: false,
	sourceUpdatedAt: null
};

describe('wahl-portal-context', () => {
	it('Default: agh/kiez, kein Jahr-Override, leere Wahlen, status idle', () => {
		const s = makeState();
		expect(s.reihe).toBe('agh');
		expect(s.ebene).toBe('kiez');
		expect(s.jahrOverride).toBeNull();
		expect(s.wahlen).toEqual([]);
		expect(s.status).toBe('idle');
	});

	it('jahreForReihe filtert nach Typ und sortiert jüngstes zuerst', () => {
		const s = makeState({ wahlen: [AGH_2021, AGH_2023, BTW_2025] });
		expect(jahreForReihe(s, 'agh').map((w) => w.jahr)).toEqual([2023, 2021]);
		expect(jahreForReihe(s, 'btw').map((w) => w.jahr)).toEqual([2025]);
		expect(jahreForReihe(s, 'bvv')).toEqual([]);
	});

	it('jahreForReihe dedupliziert Jahre über Stimmtypen (Erst+Zweitstimme = ein Chip)', () => {
		// /api/wahl/list liefert pro Jahr ZWEI Rows (erststimme + zweitstimme);
		// ohne Dedupe crasht das keyed each in der Steuerleiste (each_key_duplicate).
		const AGH_2023_ERST: WahlPortalListEntry = { ...AGH_2023, slug: '2023-agh-erststimme' };
		const s = makeState({ wahlen: [AGH_2023, AGH_2023_ERST, AGH_2021] });
		const jahre = jahreForReihe(s, 'agh').map((w) => w.jahr);
		expect(jahre).toEqual([2023, 2021]);
		expect(new Set(jahre).size).toBe(jahre.length);
	});

	it('currentJahr: ohne Override das jüngste Jahr der Reihe', () => {
		const s = makeState({ wahlen: [AGH_2021, AGH_2023] });
		expect(currentJahr(s)).toBe(2023);
	});

	it('currentJahr: mit gültigem Override genau dieses Jahr', () => {
		const s = makeState({ wahlen: [AGH_2021, AGH_2023], jahrOverride: 2021 });
		expect(currentJahr(s)).toBe(2021);
	});

	it('currentJahr: null wenn die Reihe keine Wahlen hat (DB-los)', () => {
		const s = makeState({ wahlen: [] });
		expect(currentJahr(s)).toBeNull();
	});

	it('setReihe wechselt die Reihe und behält einen gültigen Override', () => {
		const s = makeState({ wahlen: [AGH_2021, BTW_2025], reihe: 'agh' });
		setReihe(s, 'btw');
		expect(s.reihe).toBe('btw');
		expect(currentJahr(s)).toBe(2025);
	});

	it('setReihe: ungültiger Override springt auf jüngstes Jahr der neuen Reihe', () => {
		const s = makeState({ wahlen: [AGH_2021, BTW_2025], reihe: 'agh', jahrOverride: 2021 });
		setReihe(s, 'btw');
		expect(s.jahrOverride).toBeNull();
		expect(currentJahr(s)).toBe(2025);
	});

	it('setEbene mutiert ebene', () => {
		const s = makeState();
		setEbene(s, 'bezirk');
		expect(s.ebene).toBe('bezirk');
	});

	it('setJahr setzt einen expliziten Override', () => {
		const s = makeState({ wahlen: [AGH_2021, AGH_2023] });
		setJahr(s, 2021);
		expect(s.jahrOverride).toBe(2021);
	});

	it('applyWahlList schreibt die Liste und bereinigt einen jetzt ungültigen Override', () => {
		const s = makeState({ jahrOverride: 1999 });
		applyWahlList(s, [AGH_2021, AGH_2023]);
		expect(s.status).toBe('loaded');
		expect(s.wahlen).toHaveLength(2);
		expect(s.jahrOverride).toBeNull();
	});

	it('applyWahlList behält einen gültigen Override', () => {
		const s = makeState({ jahrOverride: 2021 });
		applyWahlList(s, [AGH_2021, AGH_2023]);
		expect(s.jahrOverride).toBe(2021);
	});

	it('loadWahlList mappt die API-Antwort (snake_case) und ruft applyWahlList-Logik auf', async () => {
		const s = makeState();
		const fetchFn = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				elections: [
					{
						slug: '2021-agh-zweitstimme',
						jahr: 2021,
						typ: 'agh',
						is_repeat_election: false,
						source_name: 'Amt für Statistik Berlin-Brandenburg',
						license: 'dl-de/by-2-0',
						vorlaeufig: false,
						source_updated_at: null
					}
				]
			})
		});
		await loadWahlList(s, fetchFn as unknown as typeof fetch);
		expect(s.status).toBe('loaded');
		expect(s.wahlen).toEqual([
			{
				slug: '2021-agh-zweitstimme',
				jahr: 2021,
				typ: 'agh',
				isRepeatElection: false,
				sourceName: 'Amt für Statistik Berlin-Brandenburg',
				license: 'dl-de/by-2-0',
				vorlaeufig: false,
				sourceUpdatedAt: null
			}
		]);
	});

	it('loadWahlList setzt status auf error bei Netzwerk-/HTTP-Fehler', async () => {
		const s = makeState();
		const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 500 });
		await loadWahlList(s, fetchFn as unknown as typeof fetch);
		expect(s.status).toBe('error');
	});

	it('vorlaeufigStatusFor liefert null solange die Liste nicht geladen ist (Story: Ingest AGH/BVV 2026)', () => {
		const s = makeState({ status: 'loading', wahlen: [] });
		expect(vorlaeufigStatusFor(s, 'agh', 2026)).toBeNull();
	});

	it('vorlaeufigStatusFor liefert null ohne jahr', () => {
		const s = makeState({ status: 'loaded', wahlen: [AGH_2021] });
		expect(vorlaeufigStatusFor(s, 'agh', null)).toBeNull();
	});

	it('vorlaeufigStatusFor liefert null ohne Treffer für typ+jahr', () => {
		const s = makeState({ status: 'loaded', wahlen: [AGH_2021] });
		expect(vorlaeufigStatusFor(s, 'agh', 2026)).toBeNull();
	});

	it('vorlaeufigStatusFor liefert vorlaeufig+sourceUpdatedAt bei Treffer', () => {
		const agh2026: WahlPortalListEntry = {
			slug: '2026-agh-zweitstimme',
			jahr: 2026,
			typ: 'agh',
			isRepeatElection: false,
			sourceName: 'Landeswahlleiterin Berlin',
			license: 'dl-de/by-2.0',
			vorlaeufig: true,
			sourceUpdatedAt: '2026-09-20T23:55:55.000Z'
		};
		const s = makeState({ status: 'loaded', wahlen: [AGH_2021, agh2026] });
		expect(vorlaeufigStatusFor(s, 'agh', 2026)).toEqual({
			vorlaeufig: true,
			sourceUpdatedAt: '2026-09-20T23:55:55.000Z'
		});
		expect(vorlaeufigStatusFor(s, 'agh', 2021)).toEqual({
			vorlaeufig: false,
			sourceUpdatedAt: null
		});
	});

	it('getWahlPortalState wirft, wenn kein Provider in Context', () => {
		const host = document.createElement('div');
		expect(() => {
			const cmp = mount(MissingProvider, { target: host });
			unmount(cmp);
		}).toThrow();
	});

	it('Exporte createWahlPortalState + getWahlPortalState sind Funktionen', () => {
		expect(typeof createWahlPortalState).toBe('function');
		expect(typeof getWahlPortalState).toBe('function');
	});
});
