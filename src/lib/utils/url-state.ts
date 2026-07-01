export type Bbox = [number, number, number, number];
export type LngLat = [number, number];

export interface ViewportState {
	bbox?: Bbox;
	zoom?: number;
	center?: LngLat;
}

export interface AddressState {
	q?: string;
	lat?: number;
	lng?: number;
}

const COORD_PRECISION = 5;
const ZOOM_PRECISION = 2;
const ZOOM_MIN = 0;
const ZOOM_MAX = 22;
const LAT_MIN = -90;
const LAT_MAX = 90;
const LNG_MIN = -180;
const LNG_MAX = 180;

function fixCoord(n: number): string {
	return n.toFixed(COORD_PRECISION);
}

function isValidLng(n: number): boolean {
	return Number.isFinite(n) && n >= LNG_MIN && n <= LNG_MAX;
}

function isValidLat(n: number): boolean {
	return Number.isFinite(n) && n >= LAT_MIN && n <= LAT_MAX;
}

export function serializeViewport(state: ViewportState): URLSearchParams {
	const params = new URLSearchParams();
	if (state.bbox) {
		const [w, s, e, n] = state.bbox;
		params.set('bbox', [w, s, e, n].map(fixCoord).join(','));
	}
	if (typeof state.zoom === 'number' && Number.isFinite(state.zoom)) {
		params.set('zoom', state.zoom.toFixed(ZOOM_PRECISION));
	}
	if (state.center) {
		params.set('center', state.center.map(fixCoord).join(','));
	}
	return params;
}

export function parseViewport(params: URLSearchParams): ViewportState {
	const out: ViewportState = {};

	const bboxStr = params.get('bbox');
	if (bboxStr) {
		const parts = bboxStr.split(',').map((s) => parseFloat(s));
		if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
			const [w, s, e, n] = parts as Bbox;
			if (isValidLng(w) && isValidLng(e) && isValidLat(s) && isValidLat(n)) {
				out.bbox = [w, s, e, n];
			}
		}
	}

	const zoomStr = params.get('zoom');
	if (zoomStr) {
		const z = parseFloat(zoomStr);
		if (Number.isFinite(z) && z >= ZOOM_MIN && z <= ZOOM_MAX) {
			out.zoom = z;
		}
	}

	const centerStr = params.get('center');
	if (centerStr) {
		const parts = centerStr.split(',').map((s) => parseFloat(s));
		if (parts.length === 2 && isValidLng(parts[0]!) && isValidLat(parts[1]!)) {
			out.center = [parts[0]!, parts[1]!];
		}
	}

	return out;
}

export function serializeLayers(slugs: string[]): string {
	return slugs.join(',');
}

const BUNDLE_ORDER: Record<string, number> = {
	'A: Boundaries': 0,
	'B: Wohn-Daten': 1,
	'C: Umwelt': 2,
	'D: Memorial': 3,
	'E: Soziale Infrastruktur': 4,
	'F: Mobilität': 5,
	'G: Kiez-Score': 6,
	'I: Demografie': 8,
	'J: Kultur': 9
};

const UNKNOWN_BUNDLE_RANK = 99;

export interface LayerSlugLookup {
	readonly slug: string;
	readonly bundleGroup: string;
}

export function sortLayerSlugsByBundle(
	slugs: readonly string[],
	layers: readonly LayerSlugLookup[]
): string[] {
	const bySlug = new Map(layers.map((l) => [l.slug, l.bundleGroup] as const));
	return [...slugs].sort((a, b) => {
		const bundleA = bySlug.get(a);
		const bundleB = bySlug.get(b);
		const rankA = bundleA ? (BUNDLE_ORDER[bundleA] ?? UNKNOWN_BUNDLE_RANK) : UNKNOWN_BUNDLE_RANK;
		const rankB = bundleB ? (BUNDLE_ORDER[bundleB] ?? UNKNOWN_BUNDLE_RANK) : UNKNOWN_BUNDLE_RANK;
		if (rankA !== rankB) return rankA - rankB;
		return a.localeCompare(b, 'de');
	});
}

export function parseLayers(value: string | null): string[] {
	if (!value) return [];
	const seen = new Set<string>();
	const out: string[] = [];
	for (const raw of value.split(',')) {
		const trimmed = raw.trim();
		if (!trimmed || seen.has(trimmed)) continue;
		seen.add(trimmed);
		out.push(trimmed);
	}
	return out;
}

export function serializeAddress(state: AddressState): URLSearchParams {
	const params = new URLSearchParams();
	if (
		typeof state.lng === 'number' &&
		typeof state.lat === 'number' &&
		isValidLng(state.lng) &&
		isValidLat(state.lat)
	) {
		params.set('address', `${fixCoord(state.lng)},${fixCoord(state.lat)}`);
	}
	if (state.q && state.q.trim()) {
		params.set('q', state.q);
	}
	return params;
}

export interface ComparisonState {
	a?: LngLat;
	b?: LngLat;
	active: boolean;
}

function parseLngLat(raw: string | null): LngLat | undefined {
	if (!raw) return undefined;
	const parts = raw.split(',').map((s) => parseFloat(s));
	if (parts.length !== 2) return undefined;
	const [lng, lat] = parts as [number, number];
	if (!isValidLng(lng) || !isValidLat(lat)) return undefined;
	return [lng, lat];
}

export function serializeComparison(state: ComparisonState): URLSearchParams {
	const params = new URLSearchParams();
	if (state.a) {
		const [lng, lat] = state.a;
		if (isValidLng(lng) && isValidLat(lat)) {
			params.set('a', `${fixCoord(lng)},${fixCoord(lat)}`);
		}
	}
	if (state.b) {
		const [lng, lat] = state.b;
		if (isValidLng(lng) && isValidLat(lat)) {
			params.set('b', `${fixCoord(lng)},${fixCoord(lat)}`);
		}
	}
	if (state.active) params.set('compare', '1');
	return params;
}

export function parseComparison(params: URLSearchParams): ComparisonState {
	const out: ComparisonState = { active: false };
	const a = parseLngLat(params.get('a'));
	const b = parseLngLat(params.get('b'));
	if (a) out.a = a;
	if (b) out.b = b;
	// AC-7: compare=1 ohne b fällt auf single-mode zurück
	if (params.get('compare') === '1' && a && b) out.active = true;
	return out;
}

export function buildComparePermalink(
	origin: string,
	state: ComparisonState,
	layers: readonly string[]
): string {
	const params = serializeComparison(state);
	if (layers.length > 0) params.set('layers', serializeLayers([...layers]));
	const base = origin.endsWith('/') ? origin : `${origin}/`;
	const query = params.toString();
	return query ? `${base}?${query}` : base;
}

/**
 * Story 16.1: Deep-Link von der Landing-Page in den Explorer mit vorab aktiven Layern.
 * Nutzt serializeLayers wieder, damit der `layers`-Param-Vertrag mit /explore stabil bleibt.
 */
export function buildExplorerDeepLink(layers: readonly string[]): string {
	if (layers.length === 0) return '/explore';
	return `/explore?layers=${serializeLayers([...layers])}`;
}

export function parseAddress(params: URLSearchParams): AddressState {
	const out: AddressState = {};
	const address = params.get('address');
	if (address) {
		const parts = address.split(',').map((s) => parseFloat(s));
		if (parts.length === 2 && isValidLng(parts[0]!) && isValidLat(parts[1]!)) {
			out.lng = parts[0]!;
			out.lat = parts[1]!;
		}
	}
	const q = params.get('q');
	if (q) out.q = q;
	return out;
}
