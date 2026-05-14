import { COLORS } from './colors.js';
import { hasPinIcon } from './pin-icon-mapping.js';
import {
	buildLayerSpec,
	getStyleProfile,
	type BuildOptions,
	type MapLibreLayerSpec,
	type StyleProfile
} from './layer-style-builder.js';

export type CascadeVariant = 'fill' | 'outline' | 'outline-dash';

const POLYGON_PROFILES: ReadonlySet<StyleProfile> = new Set<StyleProfile>([
	'choropleth-brw',
	'choropleth-belastung-3',
	'choropleth-versorgung-3',
	'choropleth-status-3',
	'choropleth-mehrfach',
	'choropleth-pet',
	'choropleth-wohnlage-3',
	'polygon-highlight',
	'polygon-outline-soft'
]);

export function isPolygonProfile(profile: StyleProfile): boolean {
	return POLYGON_PROFILES.has(profile);
}

export function isPolygonSlug(slug: string): boolean {
	if (hasPinIcon(slug)) return false;
	return isPolygonProfile(getStyleProfile(slug));
}

export function computeCascadeVariants(
	slugs: readonly string[]
): ReadonlyMap<string, CascadeVariant> {
	const out = new Map<string, CascadeVariant>();
	let polyIndex = 0;
	for (const slug of slugs) {
		if (!isPolygonSlug(slug)) continue;
		if (polyIndex === 0) out.set(slug, 'fill');
		else if (polyIndex === 1) out.set(slug, 'outline');
		else out.set(slug, 'outline-dash');
		polyIndex++;
	}
	return out;
}

const OUTLINE_LINE_WIDTH = 2;
const OUTLINE_LINE_OPACITY = 0.85;
const OUTLINE_DASH_PATTERN: readonly [number, number] = [4, 4];

function fillSpecToLineSpec(spec: MapLibreLayerSpec, dash: boolean): MapLibreLayerSpec {
	const fillColor = spec.paint?.['fill-color'] ?? COLORS.accent;
	const paint: Record<string, unknown> = {
		'line-color': fillColor,
		'line-width': OUTLINE_LINE_WIDTH,
		'line-opacity': OUTLINE_LINE_OPACITY
	};
	if (dash) paint['line-dasharray'] = [...OUTLINE_DASH_PATTERN];
	return {
		id: spec.id,
		type: 'line',
		source: spec.source,
		paint
	};
}

export function buildLayerSpecCascade(
	slug: string,
	sourceId: string,
	variant: CascadeVariant,
	options: BuildOptions = {}
): MapLibreLayerSpec[] {
	const baseSpecs = buildLayerSpec(slug, sourceId, options);
	if (variant === 'fill') return baseSpecs;
	if (!isPolygonSlug(slug)) return baseSpecs;
	const dash = variant === 'outline-dash';
	return baseSpecs.map((spec) =>
		spec.type === 'fill' ? fillSpecToLineSpec(spec, dash) : spec
	);
}
