import type { LayerMetadata, License } from '$lib/data/types.js';

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

const DE_NUMBER_FORMATTER = new Intl.NumberFormat('de-DE');

function formatYear(iso: string): string {
	const match = iso.match(/^(\d{4})/);
	return match ? match[1]! : iso;
}

function asString(v: unknown): string | undefined {
	if (typeof v === 'string' && v.trim().length > 0) return v.trim();
	if (typeof v === 'number' && Number.isFinite(v)) return String(v);
	return undefined;
}

function describeBezirk(props: Record<string, unknown>): string {
	const name = asString(props.name) ?? 'unbekannt';
	const einwohner =
		typeof props.einwohner === 'number' && Number.isFinite(props.einwohner)
			? DE_NUMBER_FORMATTER.format(props.einwohner)
			: undefined;
	return einwohner ? `Bezirk: ${name}, ${einwohner} Einwohner` : `Bezirk: ${name}`;
}

function describeLor(props: Record<string, unknown>): string {
	const name = asString(props.name) ?? 'unbekannt';
	return `Kiez: ${name}`;
}

function describeLaerm(props: Record<string, unknown>, layer: LayerMetadata, label: string): string {
	const value = asString(props.value) ?? asString(props.lden) ?? asString(props.lnight);
	const year = formatYear(layer.fetchedAt);
	const valuePart = value ? `${value} dB` : 'Wert unbekannt';
	return `Lärmkarte ${label}: ${valuePart}, Stand ${year}`;
}

function describeStolperstein(props: Record<string, unknown>): string {
	const person = asString(props.person) ?? asString(props.name);
	const street = asString(props['addr:street']);
	const houseNo = asString(props['addr:housenumber']);
	const address = [street, houseNo].filter(Boolean).join(' ');
	const parts: string[] = [person ? `Stolperstein für ${person}` : 'Stolperstein'];
	if (address) parts.push(address);
	return parts.join(', ');
}

function describeGeneric(props: Record<string, unknown>, layer: LayerMetadata): string {
	return asString(props.name) ?? layer.slug;
}

function describeByLayer(props: Record<string, unknown>, layer: LayerMetadata): string {
	switch (layer.slug) {
		case 'bezirke':
			return describeBezirk(props);
		case 'ortsteile':
			return `Ortsteil: ${asString(props.name) ?? 'unbekannt'}`;
		case 'lor-regionen':
		case 'lor-planungsraeume':
		case 'kieze':
			return describeLor(props);
		case 'laerm-den':
			return describeLaerm(props, layer, 'Straßenverkehr Tag');
		case 'laerm-night':
		case 'laerm-nacht':
			return describeLaerm(props, layer, 'Straßenverkehr Nacht');
		case 'stolpersteine':
			return describeStolperstein(props);
		default:
			return describeGeneric(props, layer);
	}
}

function layerLabel(layer: LayerMetadata): string {
	switch (layer.slug) {
		case 'bezirke':
			return 'Bezirke';
		case 'ortsteile':
			return 'Ortsteile';
		case 'lor-regionen':
		case 'lor-planungsraeume':
			return 'LOR-Regionen';
		case 'kieze':
			return 'Kieze';
		case 'laerm-den':
			return 'Lärmkarte L_DEN';
		case 'laerm-night':
		case 'laerm-nacht':
			return 'Lärmkarte L_Night';
		case 'stolpersteine':
			return 'Stolpersteine';
		default:
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
	layer: LayerMetadata
): AccessibleFeature {
	return {
		id: syntheticId(input),
		layerSlug: layer.slug,
		layerName: layerLabel(layer),
		description: describeByLayer(input.properties, layer),
		geometryType: input.geometryType,
		centroid: input.centroid,
		source: layer.sourceUrl,
		updatedAt: layer.fetchedAt,
		license: layer.license
	};
}
