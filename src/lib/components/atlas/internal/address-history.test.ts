import { describe, expect, it } from 'vitest';
import {
	addressHistoryMode,
	formatAddressParam,
	resolvePopstateSelection
} from './address-history.js';

describe('formatAddressParam', () => {
	it('rundet auf fünf Nachkommastellen wie der URL-Parameter', () => {
		expect(formatAddressParam([13.431774, 52.498451])).toBe('13.43177,52.49845');
	});
});

describe('addressHistoryMode', () => {
	it('legt für eine neue Adresswahl einen History-Eintrag an', () => {
		expect(
			addressHistoryMode({
				intent: 'user',
				currentAddress: '13.43177,52.49845',
				lastWrittenAddress: '13.43177,52.49845',
				nextAddress: '13.45410,52.51260'
			})
		).toBe('push');
	});

	it('legt auch ohne vorherige Adresse in der URL einen Eintrag an', () => {
		expect(
			addressHistoryMode({
				intent: 'user',
				currentAddress: null,
				lastWrittenAddress: null,
				nextAddress: '13.45410,52.51260'
			})
		).toBe('push');
	});

	it('ersetzt, wenn die URL die Adresse schon trägt (Einstieg per Link, Back)', () => {
		expect(
			addressHistoryMode({
				intent: 'user',
				currentAddress: '13.45410,52.51260',
				lastWrittenAddress: null,
				nextAddress: '13.45410,52.51260'
			})
		).toBe('replace');
	});

	it('ersetzt, wenn dieselbe Adresse gerade geschrieben wurde (doppelter Aufruf vor goto-Ende)', () => {
		expect(
			addressHistoryMode({
				intent: 'user',
				currentAddress: '13.43177,52.49845',
				lastWrittenAddress: '13.45410,52.51260',
				nextAddress: '13.45410,52.51260'
			})
		).toBe('replace');
	});

	it('ersetzt beim Wiederherstellen (Default-Punkt, Back), auch bei neuer Adresse', () => {
		expect(
			addressHistoryMode({
				intent: 'restore',
				currentAddress: null,
				lastWrittenAddress: null,
				nextAddress: '13.37770,52.51631'
			})
		).toBe('replace');
	});
});

describe('resolvePopstateSelection', () => {
	const marker = { lng: 13.43177, lat: 52.49845 };

	it('tut nichts ohne Adresse in der URL und ohne Marker', () => {
		expect(resolvePopstateSelection({}, null)).toEqual({ kind: 'none' });
	});

	it('schließt die Auswahl, wenn die frühere URL keine Adresse trug', () => {
		expect(resolvePopstateSelection({}, marker)).toEqual({ kind: 'clear' });
	});

	it('tut nichts, wenn die Adresse der URL schon gewählt ist', () => {
		expect(resolvePopstateSelection({ lng: 13.431771, lat: 52.498449 }, marker)).toEqual({
			kind: 'none'
		});
	});

	it('wählt die Adresse der früheren URL wieder, mit Namen aus q', () => {
		expect(
			resolvePopstateSelection({ lng: 13.4541, lat: 52.5126, q: 'Boxhagener Straße 12' }, marker)
		).toEqual({
			kind: 'select',
			lng: 13.4541,
			lat: 52.5126,
			displayName: 'Boxhagener Straße 12'
		});
	});

	it('nutzt Koordinaten als Namen, wenn q fehlt', () => {
		expect(resolvePopstateSelection({ lng: 13.4541, lat: 52.5126 }, null)).toEqual({
			kind: 'select',
			lng: 13.4541,
			lat: 52.5126,
			displayName: '52.51260, 13.45410'
		});
	});
});
