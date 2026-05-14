import type { Feature, FeatureCollection, Geometry, Point } from 'geojson';

export type Modus = 'ubahn' | 'sbahn' | 'tram' | 'bus';

export interface RawStop {
	name: string;
	lat: number;
	lng: number;
	lines?: string[];
}

export interface OepnvStopIndex {
	ubahn: RawStop[];
	sbahn: RawStop[];
	tram: RawStop[];
	bus: RawStop[];
}

function isPoint(geometry: Geometry | null): geometry is Point {
	return !!geometry && geometry.type === 'Point';
}

function matchesModus(props: Record<string, unknown>, modus: Modus): boolean {
	switch (modus) {
		case 'ubahn':
			return props.station === 'subway' || props.subway === 'yes';
		case 'sbahn':
			return (
				props.station === 'light_rail' ||
				props.light_rail === 'yes' ||
				props.station === 'train'
			);
		case 'tram':
			return props.railway === 'tram_stop' || props.tram === 'yes';
		case 'bus':
			return props.highway === 'bus_stop' || props.bus === 'yes';
	}
}

function parseLines(raw: unknown): string[] | undefined {
	if (typeof raw !== 'string') return undefined;
	const parts = raw
		.split(';')
		.map((p) => p.trim())
		.filter((p) => p.length > 0);
	return parts.length > 0 ? parts : undefined;
}

export function extractStopFromFeature(
	feature: Feature,
	modus: Modus
): RawStop | null {
	if (!isPoint(feature.geometry)) return null;
	const props = (feature.properties ?? {}) as Record<string, unknown>;
	if (!matchesModus(props, modus)) return null;
	const name = typeof props.name === 'string' ? props.name.trim() : '';
	if (name.length === 0) return null;
	const [lng, lat] = feature.geometry.coordinates;
	if (typeof lng !== 'number' || typeof lat !== 'number') return null;
	const stop: RawStop = { name, lat, lng };
	const lines = parseLines(props.line);
	if (lines) stop.lines = lines;
	return stop;
}

function dedupeKey(stop: RawStop): string {
	return `${stop.name}|${stop.lat.toFixed(3)}|${stop.lng.toFixed(3)}`;
}

export function dedupeStops(stops: readonly RawStop[]): RawStop[] {
	const acc = new Map<string, RawStop>();
	for (const stop of stops) {
		const key = dedupeKey(stop);
		const existing = acc.get(key);
		if (!existing) {
			acc.set(key, { ...stop, lines: stop.lines ? [...stop.lines] : undefined });
			continue;
		}
		if (stop.lines) {
			const merged = new Set(existing.lines ?? []);
			for (const line of stop.lines) merged.add(line);
			existing.lines = [...merged];
		}
	}
	return [...acc.values()];
}

export function extractStops(
	fc: FeatureCollection,
	modus: Modus
): RawStop[] {
	const out: RawStop[] = [];
	for (const f of fc.features) {
		const stop = extractStopFromFeature(f, modus);
		if (stop) out.push(stop);
	}
	return out;
}

export function buildOepnvStopIndex(input: {
	ubahn: FeatureCollection;
	sbahn: FeatureCollection;
	tram: FeatureCollection;
	bus: FeatureCollection;
}): OepnvStopIndex {
	return {
		ubahn: dedupeStops(extractStops(input.ubahn, 'ubahn')),
		sbahn: dedupeStops(extractStops(input.sbahn, 'sbahn')),
		tram: dedupeStops(extractStops(input.tram, 'tram')),
		bus: dedupeStops(extractStops(input.bus, 'bus'))
	};
}
