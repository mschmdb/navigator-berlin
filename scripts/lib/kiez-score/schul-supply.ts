import type { Feature } from 'geojson';

/**
 * Schulart-Differenzierung (Story 10.3). `schulen-2024.schulart` hat ~20 Werte.
 * Family-relevant: Grundschul-Nähe (kurze Schwelle) vs. weiterführende Schule (lang).
 * Nur exakt `Grundschule` zählt als grundschule; alles andere + unbekannt = weiterfuehrend
 * (sicherer Default, kein falsches Negativ durch zu enge Schwelle).
 */
export type SchulartGruppe = 'grundschule' | 'weiterfuehrend';

export function classifySchulart(schulart: unknown): SchulartGruppe {
	return schulart === 'Grundschule' ? 'grundschule' : 'weiterfuehrend';
}

export function splitSchulenByArt(features: readonly Feature[]): {
	grundschule: Feature[];
	weiterfuehrend: Feature[];
} {
	const grundschule: Feature[] = [];
	const weiterfuehrend: Feature[] = [];
	for (const f of features) {
		if (classifySchulart(f.properties?.schulart) === 'grundschule') grundschule.push(f);
		else weiterfuehrend.push(f);
	}
	return { grundschule, weiterfuehrend };
}
