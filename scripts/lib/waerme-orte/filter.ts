/**
 * Wärme-Orte (#61): Kategorie- und Ausschlussregeln für OSM-Objekte als reine Funktion.
 * `scripts/osm/extract-waerme-orte.py` sammelt grob (nur Kategorie-Tags), dieser Filter
 * entscheidet. Regeln und Reihenfolge stehen in docs/waerme-orte-methodik.md.
 */

export interface ClassifyInput {
	tags: Record<string, string>;
	/** Wert des OSM-Tags `opening_hours`, leer wenn nicht gesetzt */
	oh: string;
}

export type ExcludeReason =
	| 'no_category'
	| 'shelter'
	| 'access_restricted'
	| 'group_specific'
	| 'museum_fee'
	| 'no_opening_hours';

export type Classification =
	| { candidate: true; cat: string }
	| { candidate: false; reason: ExcludeReason };

const RESTRICTED_ACCESS = new Set(['private', 'members', 'customers', 'no']);

const OPEN_COMMUNITY_SUBTYPES = new Set([
	'community_hall',
	'social_centre',
	'village_hall',
	'cultural_centre',
	'family_centre'
]);

type Category = { cat: string; needsHours: boolean };

function categoryOf(tags: Record<string, string>): Category | null {
	if (tags.amenity === 'library') return { cat: 'Bibliothek', needsHours: false };
	if (tags.shop === 'mall') return { cat: 'Mall', needsHours: false };
	if (tags.shop === 'department_store') return { cat: 'Kaufhaus', needsHours: false };
	if (tags.tourism === 'museum') return { cat: 'Museum', needsHours: false };
	if (tags.amenity === 'community_centre') return { cat: 'Stadtteilzentrum', needsHours: true };
	if (tags.amenity === 'place_of_worship') {
		return { cat: tags.religion === 'christian' ? 'Kirche' : 'Gotteshaus', needsHours: true };
	}
	return null;
}

export function classifyPlace({ tags, oh }: ClassifyInput): Classification {
	const category = categoryOf(tags);
	if (!category) return { candidate: false, reason: 'no_category' };

	if (tags.social_facility === 'shelter') return { candidate: false, reason: 'shelter' };
	if (RESTRICTED_ACCESS.has(tags.access ?? '')) {
		return { candidate: false, reason: 'access_restricted' };
	}
	if (tags.social_facility) return { candidate: false, reason: 'group_specific' };
	if (
		category.cat === 'Stadtteilzentrum' &&
		tags.community_centre &&
		!OPEN_COMMUNITY_SUBTYPES.has(tags.community_centre)
	) {
		return { candidate: false, reason: 'group_specific' };
	}
	if (category.cat === 'Museum' && tags.fee === 'yes') {
		return { candidate: false, reason: 'museum_fee' };
	}
	if (category.needsHours && oh.trim() === '') {
		return { candidate: false, reason: 'no_opening_hours' };
	}
	return { candidate: true, cat: category.cat };
}
