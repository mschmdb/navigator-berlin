import type { LayerMetadata, License } from '$lib/data/types.js';
import { m } from '$lib/paraglide/messages.js';
import { formatCount } from '$lib/i18n/format.js';
import { toAtlasMessageOptions, type LocaleOptions } from './atlas-label-options.js';
import { getLayerDisplayName } from './layer-palette-filter.js';

export interface AccessibleFeatureInput {
	id: string | number | undefined;
	layerId: string;
	geometryType: 'Point' | 'Polygon' | 'MultiPolygon';
	properties: Record<string, unknown>;
	centroid: [number, number];
}

export interface AccessibleFeature {
	id: string;
	layerSlug: string;
	layerName: string;
	description: string;
	geometryType: 'Point' | 'Polygon' | 'MultiPolygon';
	centroid: [number, number];
	source: string;
	updatedAt: string;
	license: License;
}

function formatYear(iso: string): string {
	const match = iso.match(/^(\d{4})/);
	return match ? match[1]! : iso;
}

function asString(v: unknown): string | undefined {
	if (typeof v === 'string' && v.trim().length > 0) return v.trim();
	if (typeof v === 'number' && Number.isFinite(v)) return String(v);
	return undefined;
}

function describeBezirk(props: Record<string, unknown>, opts?: LocaleOptions): string {
	const options = toAtlasMessageOptions(opts);
	const name = asString(props.name) ?? m.atlas_a11y_unbekannt(undefined, options);
	const einwohner =
		typeof props.einwohner === 'number' && Number.isFinite(props.einwohner)
			? formatCount(props.einwohner, options)
			: undefined;
	// Ganze Saetze als Message (kein `${prefix}: ${name}`-Zusammenkleben,
	// Review-Fund) -- "Bezirk" bleibt in beiden Locales deutsch (Glossar).
	return einwohner
		? m.atlas_a11y_bezirk_desc_mit_einwohner({ name, count: einwohner }, options)
		: m.atlas_a11y_bezirk_desc({ name }, options);
}

function describeLor(props: Record<string, unknown>, opts?: LocaleOptions): string {
	const options = toAtlasMessageOptions(opts);
	const name = asString(props.name) ?? m.atlas_a11y_unbekannt(undefined, options);
	return m.atlas_a11y_kiez_desc({ name }, options);
}

function describeLaerm(
	props: Record<string, unknown>,
	layer: LayerMetadata,
	period: string,
	opts?: LocaleOptions
): string {
	const options = toAtlasMessageOptions(opts);
	const rawValue = asString(props.value) ?? asString(props.lden) ?? asString(props.lnight);
	const year = formatYear(layer.fetchedAt);
	const value = rawValue ? `${rawValue} dB` : m.atlas_a11y_wert_unbekannt(undefined, options);
	return m.atlas_a11y_laermkarte_desc({ period, value, year }, options);
}

function describeStolperstein(props: Record<string, unknown>, opts?: LocaleOptions): string {
	const options = toAtlasMessageOptions(opts);
	const person = asString(props.person) ?? asString(props.name);
	const street = asString(props['addr:street']);
	const houseNo = asString(props['addr:housenumber']);
	const address = [street, houseNo].filter(Boolean).join(' ');
	const parts: string[] = [
		person
			? m.atlas_a11y_stolperstein_desc({ name: person }, options)
			: m.atlas_a11y_stolperstein(undefined, options)
	];
	if (address) parts.push(address);
	return parts.join(', ');
}

function describeGeneric(props: Record<string, unknown>, layer: LayerMetadata): string {
	return asString(props.name) ?? layer.slug;
}

function describeByLayer(
	props: Record<string, unknown>,
	layer: LayerMetadata,
	opts?: LocaleOptions
): string {
	const options = toAtlasMessageOptions(opts);
	switch (layer.slug) {
		case 'bezirke':
			return describeBezirk(props, opts);
		case 'ortsteile':
			return m.atlas_a11y_ortsteil_desc(
				{ name: asString(props.name) ?? m.atlas_a11y_unbekannt(undefined, options) },
				options
			);
		case 'lor-regionen':
		case 'lor-planungsraeume':
		case 'kieze':
			return describeLor(props, opts);
		case 'laerm-den':
			return describeLaerm(
				props,
				layer,
				m.atlas_a11y_strassenverkehr_tag(undefined, options),
				opts
			);
		case 'laerm-night':
		case 'laerm-nacht':
			return describeLaerm(
				props,
				layer,
				m.atlas_a11y_strassenverkehr_nacht(undefined, options),
				opts
			);
		case 'stolpersteine':
			return describeStolperstein(props, opts);
		default:
			return describeGeneric(props, layer);
	}
}

function layerLabel(layer: LayerMetadata, opts?: LocaleOptions): string {
	const options = toAtlasMessageOptions(opts);
	switch (layer.slug) {
		// Diese drei Slugs sind ECHTE Layer mit `LAYER_EXPLAIN_DE`-Eintrag --
		// Konsolidierung (Review-Fund): dieselbe Layer-Palette-Bezeichnung statt
		// einer zweiten, identischen `atlas_a11y_layer_*`-Message.
		case 'bezirke':
		case 'ortsteile':
		case 'stolpersteine':
			return getLayerDisplayName(layer.slug, opts);
		// Legacy/synthetische Slugs ohne `LAYER_EXPLAIN_DE`-Eintrag (Story 1.3
		// Re-Run TODO, siehe value-formatters.ts) -- eigene a11y-only Labels,
		// keine Layer-Palette-Entsprechung zum Konsolidieren.
		case 'lor-regionen':
		case 'lor-planungsraeume':
			return m.atlas_a11y_layer_lor_regionen(undefined, options);
		case 'kieze':
			return m.atlas_a11y_layer_kieze(undefined, options);
		case 'laerm-den':
			return m.atlas_a11y_layer_laerm_den(undefined, options);
		case 'laerm-night':
		case 'laerm-nacht':
			return m.atlas_a11y_layer_laerm_night(undefined, options);
		default:
			// Review-Fund: DE muss Byte-identisch zum Alt-Verhalten (vor B3a)
			// bleiben -- das war IMMER der rohe Slug, für jeden nicht explizit
			// gelisteten Layer (z. B. "laerm-2023"). `getLayerDisplayName` hätte
			// hier einen echten Namen geliefert und damit die a11y-Ausgabe für
			// alle sonstigen Layer unbeabsichtigt geändert.
			return layer.slug;
	}
}

function syntheticId(input: AccessibleFeatureInput): string {
	if (input.id !== undefined) return `${input.layerId}:${String(input.id)}`;
	const props = input.properties;
	const osmId = asString(props.osm_id) ?? asString(props.id);
	if (osmId) return `${input.layerId}:${osmId}`;
	let hash = 0;
	const fingerprint = JSON.stringify(props) + input.centroid.join(',');
	for (let i = 0; i < fingerprint.length; i++) {
		hash = (hash * 31 + fingerprint.charCodeAt(i)) | 0;
	}
	return `${input.layerId}:${hash.toString(36)}`;
}

export function describeFeature(
	input: AccessibleFeatureInput,
	layer: LayerMetadata,
	opts?: LocaleOptions
): AccessibleFeature {
	return {
		id: syntheticId(input),
		layerSlug: layer.slug,
		layerName: layerLabel(layer, opts),
		description: describeByLayer(input.properties, layer, opts),
		geometryType: input.geometryType,
		centroid: input.centroid,
		source: layer.sourceUrl,
		updatedAt: layer.fetchedAt,
		license: layer.license
	};
}
