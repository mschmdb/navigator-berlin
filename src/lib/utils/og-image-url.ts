import { m } from '$lib/paraglide/messages.js';
import type { LocaleOptions } from '$lib/components/atlas/internal/atlas-label-options.js';
import { toAtlasMessageOptions } from '$lib/components/atlas/internal/atlas-label-options.js';

export const DEFAULT_OG_IMAGE_PATH = '/og/page/home.png';
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

export function buildOgDescription(input: OgImageInput | null, opts?: LocaleOptions): string {
	if (!input) return '';
	const options = toAtlasMessageOptions(opts);
	if (input.topLayers.length === 0) {
		return m.atlas_og_description_address({ address: input.address }, options);
	}
	return m.atlas_og_description_top_layers(
		{ topLayers: input.topLayers.slice(0, MAX_TOP_LAYERS).join(', ') },
		options
	);
}
