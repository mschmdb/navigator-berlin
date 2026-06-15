export const LAYER_SYNONYMS_DE: Record<string, readonly string[]> = {
	'kitas-2024': ['kita', 'kinder', 'kindergarten', 'krippe'],
	'schulen-2024': ['schule', 'grundschule', 'gymnasium', 'oberschule'],
	'einschulbereiche-2024': ['schule', 'einzugsgebiet', 'einschulbereich'],
	'krankenhaeuser-plan': ['krankenhaus', 'klinik', 'notaufnahme'],
	'krankenhaeuser-weitere': ['krankenhaus', 'reha', 'privatklinik'],
	spielplaetze: ['spielplatz', 'kinderspielplatz', 'familie'],
	'sportanlagen-2024': ['sport', 'fitness', 'fussball'],
	gruenanlagen: ['park', 'grün', 'gruen', 'wald', 'wiese'],
	schwimmbaeder: ['schwimmbad', 'sommerbad', 'hallenbad'],
	'mss-gesamtindex-2025': ['sozial', 'mss', 'einkommen', 'soziale lage'],
	'wohnlagen-2024': ['mietspiegel', 'wohnlage', 'miete'],
	bodenrichtwerte: ['boden', 'preis', 'grundstück', 'brw'],
	'laerm-2023': ['lärm', 'laerm', 'ruhe', 'verkehr'],
	'luft-2023': ['luft', 'feinstaub', 'stickoxid'],
	'klima-pet-2022': ['hitze', 'sommer', 'klima', 'pet'],
	'klima-kaltlufteinwirkbereich-2022': ['kaltluft', 'frisch'],
	'klima-leitbahnkorridor-2022': ['kaltluft', 'leitbahn'],
	'radverkehrsnetz-2025': ['rad', 'fahrrad', 'velo'],
	'fahrradstrassen-2024': ['fahrradstraße', 'fahrradstrasse', 'rad'],
	'ubahn-stationen': ['u-bahn', 'ubahn', 'metro'],
	'sbahn-stationen': ['s-bahn', 'sbahn', 'zug'],
	'tram-haltestellen': ['tram', 'straßenbahn', 'strassenbahn'],
	'bus-haltestellen': ['bus'],
	stolpersteine: ['stolperstein', 'gedenken', 'ns'],
	trinkbrunnen: ['trinkbrunnen', 'wasser'],
	'kiez-score-wohnschutz': ['wohnschutz', 'milieuschutz', 'erhaltung', 'kiez-score']
};

export function normalizeQueryNfd(input: string): string {
	return input.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function matchSynonyms(query: string): readonly string[] {
	const q = normalizeQueryNfd(query);
	if (!q) return [];
	const hits: string[] = [];
	for (const [slug, terms] of Object.entries(LAYER_SYNONYMS_DE)) {
		for (const term of terms) {
			const normalized = normalizeQueryNfd(term);
			if (normalized.includes(q) || q.includes(normalized)) {
				hits.push(slug);
				break;
			}
		}
	}
	return hits;
}
