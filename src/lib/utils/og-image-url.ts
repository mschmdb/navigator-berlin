export const DEFAULT_OG_IMAGE_PATH = '/og-default.png';
const MAX_TOP_LAYERS = 3;

export interface OgImageInput {
	readonly address: string;
	readonly lat: number;
	readonly lng: number;
	readonly bezirk?: string;
	readonly topLayers: readonly string[];
}

function stripTrailing(s: string): string {
	return s.endsWith('/') ? s.slice(0, -1) : s;
}

export function buildOgImageUrl(input: OgImageInput | null, baseUrl: string): string {
	const base = stripTrailing(baseUrl);
	if (!input) return `${base}${DEFAULT_OG_IMAGE_PATH}`;
	const params = new URLSearchParams();
	params.set('address', input.address);
	params.set('lat', input.lat.toString());
	params.set('lng', input.lng.toString());
	if (input.bezirk) params.set('bezirk', input.bezirk);
	const top = input.topLayers.slice(0, MAX_TOP_LAYERS);
	if (top.length > 0) params.set('topLayers', top.join('|'));
	return `${base}/api/og/share?${params.toString()}`;
}

export function buildOgDescription(input: OgImageInput | null): string {
	if (!input) return '';
	if (input.topLayers.length === 0) {
		return `Atlas-Daten zur Adresse ${input.address}.`;
	}
	return `Atlas-Daten zur Adresse: ${input.topLayers.slice(0, MAX_TOP_LAYERS).join(', ')}.`;
}
