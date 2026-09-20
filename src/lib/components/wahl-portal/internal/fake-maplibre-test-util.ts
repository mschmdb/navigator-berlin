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

export interface FakeMapLibre {
	readonly paintCalls: FakePaintCall[];
	readonly setDataCalls: unknown[];
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
	const layers: Record<string, Record<string, unknown>> = {};
	const sources: Record<string, unknown> = {};
	const handlers: Record<string, (...args: unknown[]) => void> = {};
	const setDataCalls: unknown[] = [];
	const removeCalls: number[] = [];
	let constructCount = 0;

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
		getSource(id: string) {
			return sources[id]
				? {
						setData: (data: unknown) => setDataCalls.push(data)
					}
				: undefined;
		}
		fitBounds() {}
		resize() {}
		remove() {
			removeCalls.push(1);
		}
	}

	return {
		paintCalls,
		setDataCalls,
		layers,
		handlers,
		removeCalls,
		get constructCount() {
			return constructCount;
		},
		factory: () => Promise.resolve(FakeMap as unknown as never)
	};
}
