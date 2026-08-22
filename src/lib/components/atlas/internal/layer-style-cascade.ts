import { COLORS } from './colors.js';
import { rampForSlug, SCORE_DOT_SIZES, scoreDotImageId } from './dimension-ramps.js';
import { outlineLayerIdFor } from './layer-diff.js';
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
	'choropleth-mss-12',
	'choropleth-kiez-score-ordinal-4',
	'choropleth-kiez-score-strukturell-4',
	'choropleth-dichte',
	'polygon-highlight',
	'polygon-outline-soft',
	'polygon-outline-milieuschutz-erhaltungsmiete',
	'polygon-outline-milieuschutz-staedtebau'
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
// Gestrichelt verliert die Hälfte der Tinte; etwas mehr Breite gleicht das aus.
const OUTLINE_DASH_LINE_WIDTH = 2.5;
const OUTLINE_LINE_OPACITY = 0.85;
const OUTLINE_DASH_PATTERN: readonly [number, number] = [4, 4];

function scoreDotSizeExpression(): unknown[] {
	const [s1, s2, s3, s4] = SCORE_DOT_SIZES;
	return ['step', ['to-number', ['get', 'value'], -1], s1, 0, s1, 26, s2, 51, s3, 76, s4];
}

/**
 * Sekundär-Variante = zwei Layer: der Haupt-Fill bleibt bestehen, aber
 * unsichtbar (fill-opacity 0), damit die Haupt-ID nie ihren Typ wechselt und
 * queryRenderedFeatures die Fläche fürs Tooltip weiter trifft. Die sichtbare
 * Darstellung läuft unter der -outline-ID: Punktsymbole für Score-Dimensionen,
 * Konturlinien für die übrigen Polygon-Layer.
 */
function fillSpecToOutlineSpecs(
	spec: MapLibreLayerSpec,
	dash: boolean,
	slug: string
): MapLibreLayerSpec[] {
	const fillColor = spec.paint?.['fill-color'] ?? COLORS.accent;
	// Reiner Hit-Layer: nur fill-color (für MapLibre-Validierung) + Opacity 0.
	// Kein fill-outline-color, das als zweite Grenzlinie durchscheinen könnte.
	const hitFill: MapLibreLayerSpec = {
		id: spec.id,
		type: 'fill',
		source: spec.source,
		paint: {
			'fill-color': fillColor,
			'fill-opacity': 0
		}
	};

	// Score-Dimension als zweiter Layer: abgestufte Punktsymbole statt
	// Konturnetz. Ein Liniennetz über 542 LOR-Flächen wird zum Gekritzel;
	// MapLibre platziert ein Symbol pro Fläche, die Größe kodiert das
	// Wert-Quartil, das Sprite trägt die Dimensions-Farbe.
	if (rampForSlug(slug)) {
		const dots: MapLibreLayerSpec = {
			id: outlineLayerIdFor(slug),
			type: 'symbol',
			source: spec.source,
			layout: {
				'icon-image': scoreDotImageId(slug),
				'icon-size': scoreDotSizeExpression(),
				'icon-allow-overlap': true,
				'icon-ignore-placement': true
			}
		};
		return [hitFill, dots];
	}

	const paint: Record<string, unknown> = {
		'line-color': fillColor,
		'line-width': dash ? OUTLINE_DASH_LINE_WIDTH : OUTLINE_LINE_WIDTH,
		'line-opacity': OUTLINE_LINE_OPACITY
	};
	if (dash) paint['line-dasharray'] = [...OUTLINE_DASH_PATTERN];
	const outline: MapLibreLayerSpec = {
		id: outlineLayerIdFor(slug),
		type: 'line',
		source: spec.source,
		paint
	};
	return [hitFill, outline];
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
	return baseSpecs.flatMap((spec) =>
		spec.type === 'fill' ? fillSpecToOutlineSpecs(spec, dash, slug) : [spec]
	);
}
