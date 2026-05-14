import type { LayerHit } from '$lib/data';

/**
 * Story 1.23: Pro Layer der konzeptuell nur in bestimmten Lagen anwendbar ist,
 * definiert ein Prädikat über die anderen Hits (Cross-Layer-Kontext).
 *
 * Wenn ein Layer no-coverage liefert UND konzeptuell nicht anwendbar ist,
 * wird die Reason auf 'out-of-concept' angehoben (statt 'no-coverage' = echte Lücke).
 */

const BRW_SLUG = 'bodenrichtwerte';

const RESIDENTIAL_NUTZUNG_PREFIXES = new Set<string>([
	// BauNVO + Berlin-BRW-Codes für Wohn-/Mischgebiete
	'W',
	'WA',
	'WR',
	'WS',
	'MD',
	'MI',
	'MK',
	'M1',
	'M2'
]);

function pickNutzung(value: unknown): string | null {
	if (!value || typeof value !== 'object') return null;
	const raw = (value as Record<string, unknown>).nutzung;
	return typeof raw === 'string' && raw.length > 0 ? raw : null;
}

function codePrefix(nutzung: string): string {
	const sepIndex = nutzung.indexOf(' ');
	return sepIndex === -1 ? nutzung : nutzung.slice(0, sepIndex);
}

interface ApplicabilityContext {
	/** true wenn BRW-Hit eine bewohnte Lage signalisiert (W- / M-Codes). */
	isResidential: boolean;
	/** true wenn überhaupt ein BRW-Hit existiert (sonst konservativ-anwendbar). */
	hasBrwHit: boolean;
}

function buildContext(hits: readonly LayerHit[]): ApplicabilityContext {
	let isResidential = false;
	let hasBrwHit = false;
	for (const hit of hits) {
		if (hit.layer !== BRW_SLUG) continue;
		hasBrwHit = true;
		const nutzung = pickNutzung(hit.value);
		if (!nutzung) continue;
		const code = codePrefix(nutzung);
		if (RESIDENTIAL_NUTZUNG_PREFIXES.has(code)) {
			isResidential = true;
		}
	}
	return { isResidential, hasBrwHit };
}

type Predicate = (ctx: ApplicabilityContext) => boolean;

const requiresResidential: Predicate = (ctx) => !ctx.hasBrwHit || ctx.isResidential;

/**
 * Mapping: Layer-Slug → Applicability-Prädikat.
 * Layer nicht im Mapping = universal anwendbar (kein Gate).
 */
const APPLICABILITY_RULES: Record<string, Predicate> = {
	'milieuschutz-erhaltungsmiete': requiresResidential,
	'milieuschutz-staedtebau': requiresResidential,
	'wohnlagen-2024': requiresResidential,
	'mietspiegel-wohnlage': requiresResidential
};

export function isLayerApplicable(slug: string, hits: readonly LayerHit[]): boolean {
	const rule = APPLICABILITY_RULES[slug];
	if (!rule) return true;
	return rule(buildContext(hits));
}

export function applyApplicabilityReasons(hits: readonly LayerHit[]): LayerHit[] {
	const ctx = buildContext(hits);
	return hits.map((hit) => {
		if (hit.reason !== 'no-coverage') return hit;
		const rule = APPLICABILITY_RULES[hit.layer];
		if (!rule) return hit;
		if (rule(ctx)) return hit;
		return { ...hit, reason: 'out-of-concept' };
	});
}
