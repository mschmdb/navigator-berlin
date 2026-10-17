import type { ClusterKey, PageType } from './template-schema.js';

/**
 * #99: Welche FAQ-Cluster passen zu welchem Layer. Ohne diese Zuordnung bekam
 * jeder Layer alle Layer-Templates aller Cluster (Lärm-Fragen auf der
 * Trinkbrunnen-Seite). Layer ohne Eintrag bekommen kein FAQ.
 */
const LAYER_CLUSTERS: Readonly<Record<string, readonly ClusterKey[]>> = {
	'laerm-2023': ['laerm'],
	'gruenversorgung-2023': ['gruen'],
	gruenanlagen: ['gruen'],
	'klima-pet-2022': ['klima'],
	'bioklima-2023': ['klima'],
	'klima-kaltlufteinwirkbereich-2022': ['klima'],
	'klima-leitbahnkorridor-2022': ['klima'],
	'bus-haltestellen': ['oepnv'],
	'tram-haltestellen': ['oepnv'],
	'ubahn-stationen': ['oepnv'],
	'sbahn-stationen': ['oepnv'],
	'wohnlagen-2024': ['wohnen'],
	bodenrichtwerte: ['wohnen'],
	'zensus-bestandsmiete-2022': ['wohnen'],
	'milieuschutz-erhaltungsmiete': ['wohnen']
};

/** Alle Layer mit FAQ. Netz-Layer (Linienverläufe) fehlen bewusst: Die Haltedichte-Fragen passen nicht. */
export const LAYER_FAQ_SLUGS: readonly string[] = Object.keys(LAYER_CLUSTERS);

export function layerFaqClusters(slug: string): readonly ClusterKey[] {
	return LAYER_CLUSTERS[slug] ?? [];
}

export function templateAppliesToTarget(
	target: { readonly pageType: PageType; readonly slug: string },
	cluster: ClusterKey
): boolean {
	if (target.pageType !== 'layer') return true;
	return layerFaqClusters(target.slug).includes(cluster);
}
