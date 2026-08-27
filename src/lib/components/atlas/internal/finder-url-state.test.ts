import { describe, expect, it } from 'vitest';
import { encodeFinderUrlState, parseFinderUrlState, FINDER_URL_KEYS } from './finder-url-state.js';
import { neutralWeights } from './kiez-finder-engine.js';

const params = (s: string) => new URLSearchParams(s);

describe('encodeFinderUrlState', () => {
	it('kodiert die neun Gewichte in Regler-Reihenfolge', () => {
		const encoded = encodeFinderUrlState(
			{ ...neutralWeights(), ruheLuft: 2, versorgung: 2, sbahn: 1 },
			null
		);
		expect(encoded[FINDER_URL_KEYS.weights]).toBe('2,0,0,2,0,0,0,1,0');
		expect(encoded[FINDER_URL_KEYS.party]).toBeUndefined();
	});

	it('nimmt die Partei nur mit, wenn die Partei-Ähnlichkeit aktiv ist', () => {
		const aktiv = encodeFinderUrlState({ ...neutralWeights(), partei: 2 }, 'CDU');
		expect(aktiv[FINDER_URL_KEYS.party]).toBe('CDU');
		const inaktiv = encodeFinderUrlState({ ...neutralWeights(), ruheLuft: 2 }, 'CDU');
		expect(inaktiv[FINDER_URL_KEYS.party]).toBeUndefined();
	});

	it('lässt neutrale Gewichte komplett weg: kein Parameter-Müll ohne Auswahl', () => {
		expect(encodeFinderUrlState(neutralWeights(), null)).toEqual({});
	});
});

describe('parseFinderUrlState', () => {
	it('liest kodierte Gewichte zurück', () => {
		const state = parseFinderUrlState(params('fw=2,0,0,2,0,0,0,1,0'));
		expect(state?.weights.ruheLuft).toBe(2);
		expect(state?.weights.versorgung).toBe(2);
		expect(state?.weights.sbahn).toBe(1);
		expect(state?.weights.gruenHitze).toBe(0);
		expect(state?.party).toBeNull();
	});

	it('liest die Partei mit', () => {
		const state = parseFinderUrlState(params('fw=0,0,0,0,0,0,0,0,2&fp=GR%C3%9CNE'));
		expect(state?.weights.partei).toBe(2);
		expect(state?.party).toBe('GRÜNE');
	});

	it('ist ein Roundtrip mit encodeFinderUrlState', () => {
		const original = { ...neutralWeights(), ruheLuft: -2, kultur: 1, partei: 2 };
		const encoded = encodeFinderUrlState(original, 'Die Linke');
		const state = parseFinderUrlState(params(new URLSearchParams(encoded).toString()));
		expect(state?.weights).toEqual(original);
		expect(state?.party).toBe('Die Linke');
	});

	it('gibt null zurück, wenn kein Finder-Parameter da ist', () => {
		expect(parseFinderUrlState(params('layers=laerm-2023&zoom=12'))).toBeNull();
	});

	// Fremde und manipulierte Links dürfen die Seite nicht in einen kaputten
	// Zustand bringen: unbrauchbare Werte werden verworfen, nicht geraten.
	it('verwirft kaputte Eingaben statt sie zu raten', () => {
		expect(parseFinderUrlState(params('fw=2,0,0'))).toBeNull();
		expect(parseFinderUrlState(params('fw=a,b,c,d,e,f,g,h,i'))).toBeNull();
		expect(parseFinderUrlState(params('fw=9,0,0,0,0,0,0,0,0'))).toBeNull();
		expect(parseFinderUrlState(params('fw=0,0,0,0,0,0,0,-1,0'))).toBeNull();
		expect(parseFinderUrlState(params('fw=0,0,0,0,0,0,0,0,0,0'))).toBeNull();
	});

	it('ignoriert eine unbekannte Partei, behält aber die Gewichte', () => {
		const state = parseFinderUrlState(params('fw=0,0,0,0,0,0,0,0,2&fp=Piraten'));
		expect(state?.weights.partei).toBe(2);
		expect(state?.party).toBeNull();
	});
});
