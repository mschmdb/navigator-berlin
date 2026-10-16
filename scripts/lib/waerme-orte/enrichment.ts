import type { OsmPlace, WaermeEnrichment } from './types.js';

/**
 * Wärme-Orte (#61): Schema-Validierung der redaktionellen Winter-Anreicherung sowie
 * Aufgaben-Batches für den Recherche-Lauf und das Zusammenführen der Ergebnis-Batches.
 * Reines Modul, kein I/O. Regel: Jede Angabe braucht Quelle und Prüfdatum, sonst `unknown`.
 */

const ID_PATTERN = /^(node|way|relation)\/\d+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const ENUMS = {
	winter_open: ['yes', 'limited', 'no', 'unknown'],
	stay_without_purchase: ['yes', 'no', 'unknown'],
	is_free: ['free', 'ticket', 'unknown'],
	still_exists: ['yes', 'no', 'unknown']
} as const;

function isHttpUrl(value: string): boolean {
	try {
		const { protocol } = new URL(value);
		return protocol === 'http:' || protocol === 'https:';
	} catch {
		return false;
	}
}

function claimsAnything(item: WaermeEnrichment): boolean {
	return (
		item.winter_open !== 'unknown' ||
		item.stay_without_purchase !== 'unknown' ||
		item.is_free !== 'unknown' ||
		item.opening_hours_note.trim() !== ''
	);
}

const PLACEHOLDER_NAME = /\(ohne Namen in OSM\)$/;
const STRING_FIELDS = [
	'name',
	'notes',
	'website',
	'source_url',
	'opening_hours_note',
	'suitable_reason'
] as const;

function isCalendarDate(value: string): boolean {
	if (!DATE_PATTERN.test(value)) return false;
	const date = new Date(`${value}T00:00:00Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Codepoint-Vergleich, unabhängig von der Locale. */
export function compareIds(a: string, b: string): number {
	return a < b ? -1 : a > b ? 1 : 0;
}

/** Liefert Fehlertexte, leer bei gültigem Eintrag. */
export function validateEnrichment(item: WaermeEnrichment): string[] {
	const errors: string[] = [];
	if (!ID_PATTERN.test(item.id)) errors.push(`id "${item.id}" ungültig`);
	for (const [field, allowed] of Object.entries(ENUMS)) {
		const value = item[field as keyof typeof ENUMS];
		if (!(allowed as readonly string[]).includes(value)) {
			errors.push(`${field} "${String(value)}" nicht in ${allowed.join('|')}`);
		}
	}
	if (typeof item.suitable !== 'boolean') errors.push('suitable muss boolean sein');
	const wrongType = STRING_FIELDS.filter((field) => typeof item[field] !== 'string');
	for (const field of wrongType) errors.push(`${field} muss ein String sein`);
	if (typeof item.cat !== 'string' || !item.cat.trim()) errors.push('cat fehlt');
	if (wrongType.length > 0) return errors;

	if (!item.name.trim()) errors.push('name fehlt');
	if (!item.suitable_reason.trim()) errors.push('suitable_reason fehlt');
	if (!isCalendarDate(item.checked_at ?? '')) {
		errors.push(`checked_at "${item.checked_at}" ist kein Kalenderdatum YYYY-MM-DD`);
	}
	if (item.website && !isHttpUrl(item.website))
		errors.push(`website "${item.website}" ist keine http(s)-URL`);
	if (item.source_url && !isHttpUrl(item.source_url)) {
		errors.push(`source_url "${item.source_url}" ist keine http(s)-URL`);
	}
	if (!item.source_url && (item.suitable === true || claimsAnything(item))) {
		errors.push('source_url fehlt (Pflicht bei suitable=true oder belegten Angaben)');
	}
	if (item.suitable === true) {
		if (item.winter_open === 'no') errors.push('suitable=true widerspricht winter_open=no');
		if (item.is_free === 'ticket') errors.push('suitable=true widerspricht is_free=ticket');
		if (PLACEHOLDER_NAME.test(item.name.trim())) {
			errors.push('name: suitable=true mit Platzhalter-Namen "(ohne Namen in OSM)"');
		}
	}
	return errors;
}

/** Prüft alle Einträge und doppelte ids. Leer bei gültigem Datensatz. */
export function validateEnrichmentSet(items: WaermeEnrichment[]): string[] {
	const errors: string[] = [];
	const seen = new Set<string>();
	for (const item of items) {
		if (seen.has(item.id)) errors.push(`${item.id}: id doppelt`);
		seen.add(item.id);
		errors.push(...validateEnrichment(item).map((message) => `${item.id}: ${message}`));
	}
	return errors;
}

/** Kühle-Orte-Recherche derselben OSM-ID, nur Ausgangspunkt für die Winter-Recherche. */
export interface PriorKuehleEntry {
	is_free: string;
	website: string;
	address_verified: string;
	still_exists: string;
}

export interface ResearchTask {
	id: string;
	name: string;
	cat: string;
	addr: string;
	plz: string;
	osm_opening_hours: string;
	osm_website: string;
	prior: PriorKuehleEntry | null;
}

export interface ResearchBatch {
	batch: number;
	tasks: ResearchTask[];
}

export interface CandidatePlace extends OsmPlace {
	cat: string;
}

export function buildResearchBatches(
	candidates: CandidatePlace[],
	existing: WaermeEnrichment[],
	prior: Record<string, PriorKuehleEntry>,
	batchSize: number
): ResearchBatch[] {
	if (!Number.isInteger(batchSize) || batchSize < 1) {
		throw new Error(`batchSize muss eine positive Ganzzahl sein, war ${batchSize}`);
	}
	const done = new Set(existing.map((e) => e.id));
	const open = candidates.filter((p) => !done.has(p.id)).sort((a, b) => compareIds(a.id, b.id));
	const batches: ResearchBatch[] = [];
	for (let start = 0; start < open.length; start += batchSize) {
		batches.push({
			batch: batches.length + 1,
			tasks: open.slice(start, start + batchSize).map((p) => ({
				id: p.id,
				name: p.name,
				cat: p.cat,
				addr: p.addr,
				plz: p.plz,
				osm_opening_hours: p.oh,
				osm_website: p.website,
				prior: prior[p.id] ?? null
			}))
		});
	}
	return batches;
}

export interface MergeResultsOutcome {
	merged: WaermeEnrichment[];
	errors: string[];
}

export function mergeEnrichmentResults(
	existing: WaermeEnrichment[],
	results: WaermeEnrichment[],
	candidateIds: string[]
): MergeResultsOutcome {
	const errors: string[] = [];
	const allowed = new Set(candidateIds);
	const byId = new Map(existing.map((e) => [e.id, e]));
	const seen = new Set<string>();

	for (const result of results) {
		if (seen.has(result.id)) {
			errors.push(`${result.id}: doppelt in den Ergebnissen`);
			continue;
		}
		seen.add(result.id);
		if (!allowed.has(result.id)) {
			errors.push(`${result.id}: kein Kandidat im Snapshot`);
			continue;
		}
		const problems = validateEnrichment(result);
		if (problems.length > 0) {
			errors.push(...problems.map((p) => `${result.id}: ${p}`));
			continue;
		}
		byId.set(result.id, result);
	}

	const merged = [...byId.values()].sort((a, b) => compareIds(a.id, b.id));
	return { merged, errors };
}
