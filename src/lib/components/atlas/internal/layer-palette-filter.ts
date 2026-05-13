import type { Bundle, LayerMetadata } from '$lib/data';

export const LAYER_EXPLAIN_DE: Record<string, string> = {
	// A: Boundaries
	bezirke: 'Bezirke',
	ortsteile: 'Ortsteile',
	plz: 'Postleitzahlen',
	// B: Wohn-Daten
	bodenrichtwerte: 'Bodenrichtwerte (EUR/m²)',
	'wohnlagen-2024': 'Mietspiegel-Wohnlage 2024',
	'milieuschutz-erhaltungsmiete': 'Milieuschutz: Erhaltungsmiete',
	'milieuschutz-staedtebau': 'Milieuschutz: Städtebau',
	// C: Umwelt — Umweltatlas
	'laerm-2023': 'Lärmbelastung (Umweltatlas 2023)',
	'luft-2023': 'Luftbelastung (Umweltatlas 2023)',
	'bioklima-2023': 'Thermische Belastung (Umweltatlas 2023)',
	'gruenversorgung-2023': 'Grünversorgung (Umweltatlas 2023)',
	'umweltgerechtigkeit-2023': 'Umweltgerechtigkeit gesamt (2023)',
	// C: Umwelt — Klimaanalyse 2022
	'klima-pet-2022': 'Gefühlte Temperatur (PET 14 Uhr, 2022)',
	'klima-kaltlufteinwirkbereich-2022': 'Kaltluft-Einwirkbereich (2022)',
	'klima-leitbahnkorridor-2022': 'Kaltluft-Leitbahn-Korridor (2022)',
	gruenanlagen: 'Grünanlagen',
	// D: Memorial
	stolpersteine: 'Stolpersteine',
	trinkbrunnen: 'Trinkbrunnen',
	// E: Soziale Infrastruktur
	'kitas-2024': 'Kindertagesstätten',
	'schulen-2024': 'Schulen',
	'einschulbereiche-2024': 'Einschulbereiche',
	'krankenhaeuser-plan': 'Plan-Krankenhäuser',
	'krankenhaeuser-weitere': 'Weitere Krankenhäuser',
	'sportanlagen-2024': 'Sportanlagen',
	spielplaetze: 'Spielplätze',
	schwimmbaeder: 'Schwimmbäder',
	// F: Mobilität
	'radverkehrsnetz-2025': 'Radverkehrsnetz',
	'fahrradstrassen-2024': 'Fahrradstraßen',
	'ubahn-stationen': 'U-Bahn-Stationen',
	'sbahn-stationen': 'S-Bahn-Stationen',
	'tram-haltestellen': 'Tram-Haltestellen',
	'bus-haltestellen': 'Bus-Haltestellen',
	'ubahn-netz': 'U-Bahn-Netz',
	'tram-netz': 'Tram-Netz'
};

export const BUNDLE_ORDER: readonly Bundle[] = [
	'A: Boundaries',
	'B: Wohn-Daten',
	'C: Umwelt',
	'D: Memorial',
	'E: Soziale Infrastruktur',
	'F: Mobilität'
];

export const BUNDLE_LABEL_DE: Record<Bundle, string> = {
	'A: Boundaries': 'A · Boundaries',
	'B: Wohn-Daten': 'B · Wohn-Daten',
	'C: Umwelt': 'C · Umwelt',
	'D: Memorial': 'D · Memorial',
	'E: Soziale Infrastruktur': 'E · Soziale Infrastruktur',
	'F: Mobilität': 'F · Mobilität'
};

export interface LayerGroup {
	readonly bundle: Bundle;
	readonly label: string;
	readonly layers: readonly LayerMetadata[];
}

export function getLayerDisplayName(slug: string): string {
	return LAYER_EXPLAIN_DE[slug] ?? slug;
}

export function filterLayers(
	layers: readonly LayerMetadata[],
	query: string
): readonly LayerMetadata[] {
	const q = query.trim().toLowerCase();
	if (!q) return layers;
	return layers.filter((l) => {
		const slugMatch = l.slug.toLowerCase().includes(q);
		const labelMatch = getLayerDisplayName(l.slug).toLowerCase().includes(q);
		return slugMatch || labelMatch;
	});
}

export function groupLayersByBundle(layers: readonly LayerMetadata[]): readonly LayerGroup[] {
	return BUNDLE_ORDER.map((bundle) => {
		const inBundle = layers
			.filter((l) => l.bundleGroup === bundle)
			.slice()
			.sort((a, b) => getLayerDisplayName(a.slug).localeCompare(getLayerDisplayName(b.slug), 'de'));
		return {
			bundle,
			label: BUNDLE_LABEL_DE[bundle],
			layers: inBundle
		};
	}).filter((g) => g.layers.length > 0);
}
