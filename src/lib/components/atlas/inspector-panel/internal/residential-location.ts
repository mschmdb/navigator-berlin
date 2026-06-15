import type { LayerHit } from '$lib/data';

const BRW_SLUG = 'bodenrichtwerte';

const RESIDENTIAL_CODES = new Set<string>(['W', 'WA', 'WR', 'WS', 'MD', 'MI', 'MK', 'M1', 'M2']);

function pickNutzung(value: unknown): string | null {
	if (!value || typeof value !== 'object') return null;
	const raw = (value as Record<string, unknown>).nutzung;
	return typeof raw === 'string' && raw.length > 0 ? raw : null;
}

function codePrefix(nutzung: string): string {
	const sepIndex = nutzung.indexOf(' ');
	return sepIndex === -1 ? nutzung : nutzung.slice(0, sepIndex);
}

export function isResidentialLocation(hits: readonly LayerHit[]): boolean {
	for (const hit of hits) {
		if (hit.layer !== BRW_SLUG) continue;
		const nutzung = pickNutzung(hit.value);
		if (!nutzung) continue;
		const code = codePrefix(nutzung);
		if (RESIDENTIAL_CODES.has(code)) return true;
	}
	return false;
}
