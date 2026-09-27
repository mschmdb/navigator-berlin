import type { CategoryDistribution } from '$lib/server/db/schema/aggregate-types.js';
import { formatCount, type LocaleFormatOptions } from '$lib/i18n/format.js';

/**
 * Helfer für Story 11.5: Verteilungen + Zähldaten im Steckbrief.
 * Verteilungs-Werte sind Anteile (0–1). Counts werden zu kompaktem Text.
 */
export interface DistSegment {
	readonly label: string;
	readonly share: number;
}

function capitalize(s: string): string {
	return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Verteilung (Anteile 0–1) in absteigend sortierte Segmente; leere/null → []. */
export function toSegments(dist: CategoryDistribution | null | undefined): DistSegment[] {
	if (!dist) return [];
	return Object.entries(dist)
		.filter(([, v]) => typeof v === 'number' && v > 0)
		.sort((a, b) => b[1] - a[1])
		.map(([label, share]) => ({ label: capitalize(label), share }));
}

/** Kompakter Verteilungs-Text, z. B. „Mittel 67% · Gut 17% · Schlecht 17%". */
export function distributionText(segments: readonly DistSegment[]): string {
	return segments.map((s) => `${s.label} ${Math.round(s.share * 100)}%`).join(' · ');
}

/**
 * Zähl-Text aus Label/Wert-Paaren; null/0-Werte fallen raus. „U 3 · Bus 12".
 * i18n Block B4a: Zahl über `format.ts::formatCount` (ersetzt das vormals
 * fest auf `de-DE` verdrahtete `toLocaleString`), `opts` mit DE-Default. Die
 * Labels selbst kommen bereits übersetzt vom Aufrufer (Kiez-/Bezirk-Hero).
 */
export function countsText(
	pairs: ReadonlyArray<readonly [string, number | null | undefined]>,
	opts?: LocaleFormatOptions
): string {
	return pairs
		.filter((p): p is [string, number] => typeof p[1] === 'number' && p[1] > 0)
		.map(([label, n]) => `${label} ${formatCount(n, { locale: opts?.locale ?? 'de' })}`)
		.join(' · ');
}
