import { describe, expect, it } from 'vitest';
import {
	parsePortalState,
	serializePortalState,
	DEFAULT_REIHE,
	DEFAULT_EBENE,
	type WahlPortalUrlState
} from './wahl-portal-url-state.js';

function params(query: string): URLSearchParams {
	return new URLSearchParams(query);
}

describe('parsePortalState', () => {
	it('liefert Defaults (jüngste AGH-Reihe, Ebene kiez, kein Jahr) ohne Params', () => {
		const state = parsePortalState(params(''));
		expect(state).toEqual({ reihe: 'agh', jahr: null, ebene: 'kiez' });
	});

	it('parsed einen gültigen Deep-Link exakt', () => {
		const state = parsePortalState(params('reihe=btw&jahr=2021&ebene=bezirk'));
		expect(state).toEqual({ reihe: 'btw', jahr: 2021, ebene: 'bezirk' });
	});

	it('fällt bei ungültiger reihe still auf Default zurück', () => {
		const state = parsePortalState(params('reihe=spd'));
		expect(state.reihe).toBe(DEFAULT_REIHE);
	});

	it('fällt bei ungültiger ebene still auf Default zurück', () => {
		const state = parsePortalState(params('ebene=galaxie'));
		expect(state.ebene).toBe(DEFAULT_EBENE);
	});

	it('ignoriert nicht-numerisches jahr', () => {
		const state = parsePortalState(params('jahr=zwanzig'));
		expect(state.jahr).toBeNull();
	});

	it('ignoriert jahr außerhalb des plausiblen Bereichs', () => {
		expect(parsePortalState(params('jahr=1899')).jahr).toBeNull();
		expect(parsePortalState(params('jahr=2101')).jahr).toBeNull();
	});

	it('ignoriert jahr mit falscher Stellenzahl (Injection-Schutz)', () => {
		expect(parsePortalState(params('jahr=20211')).jahr).toBeNull();
		expect(parsePortalState(params('jahr=1')).jahr).toBeNull();
	});

	it('akzeptiert jedes der drei gültigen typ-Werte', () => {
		expect(parsePortalState(params('reihe=btw')).reihe).toBe('btw');
		expect(parsePortalState(params('reihe=agh')).reihe).toBe('agh');
		expect(parsePortalState(params('reihe=bvv')).reihe).toBe('bvv');
	});

	it('akzeptiert beide gültigen ebene-Werte, berlin fällt auf Default', () => {
		expect(parsePortalState(params('ebene=kiez')).ebene).toBe('kiez');
		expect(parsePortalState(params('ebene=bezirk')).ebene).toBe('bezirk');
		expect(parsePortalState(params('ebene=berlin')).ebene).toBe(DEFAULT_EBENE);
	});
});

describe('serializePortalState', () => {
	it('schreibt keine Params für den reinen Default-Zustand (kein Query-Müll)', () => {
		const state: WahlPortalUrlState = { reihe: 'agh', jahr: null, ebene: 'kiez' };
		expect(serializePortalState(state).toString()).toBe('');
	});

	it('schreibt reihe nur wenn abweichend vom Default', () => {
		const state: WahlPortalUrlState = { reihe: 'btw', jahr: null, ebene: 'kiez' };
		expect(serializePortalState(state).toString()).toBe('reihe=btw');
	});

	it('schreibt ebene nur wenn abweichend vom Default', () => {
		const state: WahlPortalUrlState = { reihe: 'agh', jahr: null, ebene: 'bezirk' };
		expect(serializePortalState(state).toString()).toBe('ebene=bezirk');
	});

	it('schreibt jahr immer wenn explizit gesetzt, auch bei Default-Reihe', () => {
		const state: WahlPortalUrlState = { reihe: 'agh', jahr: 2021, ebene: 'kiez' };
		expect(serializePortalState(state).toString()).toBe('jahr=2021');
	});

	it('kombiniert alle drei Abweichungen', () => {
		const state: WahlPortalUrlState = { reihe: 'btw', jahr: 2021, ebene: 'bezirk' };
		const out = serializePortalState(state);
		expect(out.get('reihe')).toBe('btw');
		expect(out.get('jahr')).toBe('2021');
		expect(out.get('ebene')).toBe('bezirk');
	});

	it('roundtrip: parse(serialize(state)) === state für Nicht-Default-Werte', () => {
		const state: WahlPortalUrlState = { reihe: 'bvv', jahr: 2023, ebene: 'bezirk' };
		const roundtripped = parsePortalState(serializePortalState(state));
		expect(roundtripped).toEqual(state);
	});
});
