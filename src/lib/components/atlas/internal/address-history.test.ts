import { describe, expect, it } from 'vitest';
import {
	addressHistoryMode,
	buildAddressNavigation,
	createAddressHistoryWriter,
	formatAddressParam,
	normalizeAddressParam,
	resolvePopstateSelection
} from './address-history.js';

describe('formatAddressParam', () => {
	it('rundet auf fünf Nachkommastellen wie der URL-Parameter', () => {
		expect(formatAddressParam([13.431774, 52.498451])).toBe('13.43177,52.49845');
	});
});

describe('normalizeAddressParam', () => {
	it('bringt einen Deep-Link mit weniger Stellen auf das Schreibformat', () => {
		expect(normalizeAddressParam('13.4541,52.5126')).toBe('13.45410,52.51260');
	});

	it('liefert null für fehlende oder kaputte Werte', () => {
		expect(normalizeAddressParam(null)).toBeNull();
		expect(normalizeAddressParam('abc')).toBeNull();
		expect(normalizeAddressParam('13.4')).toBeNull();
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

describe('buildAddressNavigation', () => {
	const clearKeys = ['address', 'q', 'kiez', 'bezirk'];

	it('liest die aktuelle Adresse, bevor die Parameter gelöscht werden', () => {
		const nav = buildAddressNavigation({
			href: 'https://navigator.berlin/explore?address=13.43177,52.49845&q=Wiener+Stra%C3%9Fe+20',
			lngLat: [13.431774, 52.498451],
			displayName: 'Wiener Straße 20',
			intent: 'user',
			lastWrittenAddress: null,
			clearKeys
		});
		expect(nav.mode).toBe('replace');
	});

	it('legt für eine andere Adresse einen Eintrag an und räumt Ortsfokus ab', () => {
		const nav = buildAddressNavigation({
			href: 'https://navigator.berlin/explore?address=13.43177,52.49845&kiez=x&layer=laerm',
			lngLat: [13.4, 52.5],
			intent: 'user',
			lastWrittenAddress: null,
			clearKeys
		});
		expect(nav.mode).toBe('push');
		expect(nav.nextAddress).toBe('13.40000,52.50000');
		const params = new URLSearchParams(nav.search);
		expect(params.get('address')).toBe('13.40000,52.50000');
		expect(params.has('kiez')).toBe(false);
		expect(params.has('q')).toBe(false);
		expect(params.get('layer')).toBe('laerm');
	});

	it('setzt q, wenn ein Name übergeben wird', () => {
		const nav = buildAddressNavigation({
			href: 'https://navigator.berlin/explore',
			lngLat: [13.4, 52.5],
			displayName: 'Alexanderplatz',
			intent: 'user',
			lastWrittenAddress: null,
			clearKeys
		});
		expect(new URLSearchParams(nav.search).get('q')).toBe('Alexanderplatz');
	});
});

describe('createAddressHistoryWriter', () => {
	function deferred() {
		let resolve!: () => void;
		const promise = new Promise<void>((r) => (resolve = r));
		return { promise, resolve };
	}

	it('führt zwei Schreibvorgänge derselben Adresse zusammen, solange der erste läuft', async () => {
		const pending = deferred();
		const calls: Array<[string, string]> = [];
		const write = createAddressHistoryWriter((search, mode) => {
			calls.push([search, mode]);
			return pending.promise;
		});
		const first = write('13.40000,52.50000', '?address=13.40000,52.50000', 'push');
		const second = write('13.40000,52.50000', '?address=13.40000,52.50000', 'replace');
		expect(second).toBe(first);
		expect(calls).toEqual([['?address=13.40000,52.50000', 'push']]);
		pending.resolve();
		await first;
	});

	it('schreibt nach Abschluss erneut', async () => {
		const calls: string[] = [];
		const write = createAddressHistoryWriter(async (_search, mode) => {
			calls.push(mode);
		});
		await write('a', '?address=a', 'push');
		await write('a', '?address=a', 'replace');
		expect(calls).toEqual(['push', 'replace']);
	});

	it('schreibt eine andere Adresse auch während ein Vorgang läuft', () => {
		const pending = deferred();
		const calls: string[] = [];
		const write = createAddressHistoryWriter((search) => {
			calls.push(search);
			return pending.promise;
		});
		void write('a', '?address=a', 'push');
		void write('b', '?address=b', 'push');
		expect(calls).toEqual(['?address=a', '?address=b']);
		pending.resolve();
	});

	it('gibt den Slot frei, wenn die Navigation fehlschlägt', async () => {
		let fail = true;
		const calls: string[] = [];
		const write = createAddressHistoryWriter(async (_s, mode) => {
			calls.push(mode);
			if (fail) throw new Error('abgebrochen');
		});
		await expect(write('a', '?address=a', 'push')).rejects.toThrow('abgebrochen');
		fail = false;
		await write('a', '?address=a', 'replace');
		expect(calls).toEqual(['push', 'replace']);
	});
});
