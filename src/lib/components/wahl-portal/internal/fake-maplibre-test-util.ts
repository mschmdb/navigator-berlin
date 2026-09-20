/**
 * Geteilte Fake-MapLibre-Naht (Muster `winner-map-maplibre.svelte.test.ts`),
 * aus `trends-kapitel-maplibre.svelte.test.ts` gezogen (Review Triage Log
 * #12/#14): sowohl der Controller-Test als auch der Komponenten-Test
 * (`trends-kapitel.svelte.test.ts`) brauchen dieselbe Fake-Instanz, um die
 * Verdrahtung Toggle/Chip -> `setPaintProperty` end-to-end zu prüfen.
 */
export interface FakePaintCall {
	readonly layer: string;
	readonly prop: string;
	readonly value: unknown;
}

export interface FakeFilterCall {
	readonly layer: string;
	readonly filter: unknown;
}

export interface FakeFitBoundsCall {
	readonly bounds: unknown;
	readonly opts: unknown;
}

/** Fixer Rückgabewert des Fake-`getZoom()` NACH dem ersten `fitBounds`-Aufruf
 * -- steht für den Zoom, den `fitBounds` (animate: false) synchron erreicht
 * (Story 12). Davor liefert `getZoom()` den Konstruktions-Zoom (9), damit
 * Controller-Tests beweisen können, dass `fitZoom` wirklich NACH dem Fit
 * erfasst wird (Review Triage Log #8). */
export const FAKE_ZOOM_AFTER_FIT = 11.4;
const FAKE_CONSTRUCTION_ZOOM = 9;

/** Bounds, die `getBounds()` liefert, BEVOR ein `fitBounds`-Aufruf lief --
 * steht für die Konstruktions-`maxBounds` der echten Controller. */
const FAKE_CONSTRUCTION_BOUNDS: readonly [readonly [number, number], readonly [number, number]] = [
	[12.9, 52.25],
	[13.9, 52.75]
];

/** Simuliert, dass die NACH einem `fitBounds`-Aufruf sichtbaren Bounds von
 * der reinen Daten-Bbox abweichen (das echte MapLibre rechnet Canvas-
 * Seitenverhältnis und `padding` mit ein) -- Controller-Tests können damit
 * beweisen, dass `setMaxBounds` wirklich `instance.getBounds()` liest statt
 * die lokale `fitTo`-Bbox wiederzuverwenden (Review Triage Log #1). */
const FAKE_VISIBLE_PADDING = 0.05;

export function fakeVisibleBoundsAfterFit(
	fitTo: readonly [readonly [number, number], readonly [number, number]]
): readonly [readonly [number, number], readonly [number, number]] {
	const [[minLng, minLat], [maxLng, maxLat]] = fitTo;
	return [
		[minLng - FAKE_VISIBLE_PADDING, minLat - FAKE_VISIBLE_PADDING],
		[maxLng + FAKE_VISIBLE_PADDING, maxLat + FAKE_VISIBLE_PADDING]
	];
}

export interface FakeMapLibre {
	readonly paintCalls: FakePaintCall[];
	/** Review-Fund #1(b): `setFilter`-Aufrufe (Wechsel-Outline-Layer) für
	 * Wiring-Tests auf kiez/bezirk, analog zum lokalen Fake im Controller-Test. */
	readonly filterCalls: FakeFilterCall[];
	readonly setDataCalls: unknown[];
	/** Story 12: `setMaxBounds`/`setMinZoom`-Aufrufe nach `fitBounds`, prüfen
	 * die Karten-Anschlag-Grenzen (Wechsel-/Trends-Controller). */
	readonly setMaxBoundsCalls: unknown[];
	readonly setMinZoomCalls: number[];
	/** Review Triage Log #8: `fitBounds`-Aufrufe (Bounds + Options) aufzeichnen
	 * -- vorher war der Fake `fitBounds` ein reines No-op, Wiring-Tests konnten
	 * die Reihenfolge/Argumente also gar nicht beweisen. */
	readonly fitBoundsCalls: FakeFitBoundsCall[];
	/** Zählt `resize()`-Aufrufe -- beweist, dass der Controller synchron vor
	 * dem Fit resized (Review Triage Log #1). */
	readonly resizeCalls: number[];
	/** Aufruf-Reihenfolge von `resize`/`fitBounds`/`setMaxBounds`/`setMinZoom`
	 * als Tag-Liste -- präziser als der Vergleich einzelner Call-Arrays, wenn
	 * ein Test explizit die Reihenfolge beweisen muss (Review Triage Log #1). */
	readonly callOrder: string[];
	readonly layers: Record<string, Record<string, unknown>>;
	readonly handlers: Record<string, (...args: unknown[]) => void>;
	readonly removeCalls: number[];
	readonly constructCount: number;
	/** `Promise<never>` (statt eines konkreten MapLibre-Typs): bleibt damit
	 * strukturell kompatibel zu jeder `mapFactory`-Signatur der aufrufenden
	 * Controller, ohne den echten `maplibre-gl`-Typ hier zu importieren. */
	readonly factory: () => Promise<never>;
}

export function fakeMapFactory(): FakeMapLibre {
	const paintCalls: FakePaintCall[] = [];
	const filterCalls: FakeFilterCall[] = [];
	const layers: Record<string, Record<string, unknown>> = {};
	const sources: Record<string, unknown> = {};
	const handlers: Record<string, (...args: unknown[]) => void> = {};
	const setDataCalls: unknown[] = [];
	const setMaxBoundsCalls: unknown[] = [];
	const setMinZoomCalls: number[] = [];
	const fitBoundsCalls: FakeFitBoundsCall[] = [];
	const resizeCalls: number[] = [];
	const callOrder: string[] = [];
	const removeCalls: number[] = [];
	let constructCount = 0;
	let currentZoom = FAKE_CONSTRUCTION_ZOOM;
	let currentBounds: readonly [readonly [number, number], readonly [number, number]] =
		FAKE_CONSTRUCTION_BOUNDS;

	class FakeMap {
		constructor() {
			constructCount++;
		}
		on(event: string, layerOrHandler: unknown, handler?: unknown) {
			if (typeof handler === 'function') {
				handlers[`${event}:${String(layerOrHandler)}`] = handler as (...args: unknown[]) => void;
			} else {
				handlers[event] = layerOrHandler as (...args: unknown[]) => void;
			}
		}
		addSource(id: string, source: Record<string, unknown>) {
			sources[id] = source;
		}
		addLayer(layer: Record<string, unknown>) {
			layers[layer.id as string] = layer;
		}
		setPaintProperty(layer: string, prop: string, value: unknown) {
			paintCalls.push({ layer, prop, value });
		}
		setFilter(layer: string, filter: unknown) {
			filterCalls.push({ layer, filter });
		}
		setMaxBounds(bounds: unknown) {
			setMaxBoundsCalls.push(bounds);
			callOrder.push('setMaxBounds');
		}
		setMinZoom(zoom: number) {
			setMinZoomCalls.push(zoom);
			callOrder.push('setMinZoom');
		}
		getZoom() {
			return currentZoom;
		}
		getBounds() {
			const bounds = currentBounds;
			return { toArray: () => bounds };
		}
		getSource(id: string) {
			return sources[id]
				? {
						setData: (data: unknown) => setDataCalls.push(data)
					}
				: undefined;
		}
		hasImage() {
			return false;
		}
		addImage() {}
		getCanvas() {
			return { style: { cursor: '' } };
		}
		fitBounds(bounds: unknown, opts?: unknown) {
			fitBoundsCalls.push({ bounds, opts });
			callOrder.push('fitBounds');
			currentZoom = FAKE_ZOOM_AFTER_FIT;
			currentBounds = fakeVisibleBoundsAfterFit(
				bounds as readonly [readonly [number, number], readonly [number, number]]
			);
		}
		resize() {
			resizeCalls.push(1);
			callOrder.push('resize');
		}
		remove() {
			removeCalls.push(1);
		}
	}

	return {
		paintCalls,
		filterCalls,
		setDataCalls,
		setMaxBoundsCalls,
		setMinZoomCalls,
		fitBoundsCalls,
		resizeCalls,
		callOrder,
		layers,
		handlers,
		removeCalls,
		get constructCount() {
			return constructCount;
		},
		factory: () => Promise.resolve(FakeMap as unknown as never)
	};
}
