import type { CategoryDistribution } from '$lib/server/db/schema/aggregate-types.js';
import { formatCount, type LocaleFormatOptions } from '$lib/i18n/format.js';
import { baseLocale, type Locale } from '$lib/paraglide/runtime';
import { describeWohnlageDe, isKnownWohnlage } from '$lib/data/faq-helpers/wohnen.js';
import { mapGruenversorgungKategorie } from '$lib/components/atlas/inspector-panel/internal/gruenversorgung-kategorie.js';
import { translateClosedCategory } from '$lib/components/atlas/inspector-panel/internal/value-formatters.js';

/**
 * Helfer für Story 11.5: Verteilungen + Zähldaten im Steckbrief.
 * Verteilungs-Werte sind Anteile (0–1). Counts werden zu kompaktem Text.
 */
export interface DistSegment {
	readonly label: string;
	readonly share: number;
	/** `'de'`, wenn `label` ein unübersetzter deutscher Rohwert in einer Nicht-DE-Seite ist. */
	readonly lang?: 'de';
}

/** Kategorie-Familie der Verteilung; bestimmt, wie Rohwerte lokalisiert werden. */
export type DistributionKind = 'laerm' | 'gruen' | 'wohnlage';

export interface SegmentOptions {
	readonly locale?: Locale;
	readonly kind?: DistributionKind;
}

const SCALE_KEYS: ReadonlySet<string> = new Set([
	'sehr gering',
	'gering',
	'mittel',
	'hoch',
	'sehr hoch'
]);

const LAERM_SYNONYMS: Readonly<Record<string, string>> = {
	niedrig: 'gering',
	'sehr niedrig': 'sehr gering'
};

/** Lokalisiert einen Rohwert; `null`, wenn die Kategorie zur Familie nicht passt. */
function localizeCategory(raw: string, kind: DistributionKind, locale: Locale): string | null {
	if (kind === 'wohnlage') {
		return isKnownWohnlage(raw) ? describeWohnlageDe(raw, { locale }) : null;
	}
	const key = raw.trim().toLowerCase();
	const harmonized =
		kind === 'gruen' ? mapGruenversorgungKategorie(key) : (LAERM_SYNONYMS[key] ?? key);
	return SCALE_KEYS.has(harmonized) ? translateClosedCategory(harmonized, { locale }) : null;
}

function capitalize(s: string): string {
	return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

/**
 * Verteilung (Anteile 0–1) in absteigend sortierte Segmente; leere/null → [].
 * i18n Block D1: mit `opts.locale` ≠ DE und `opts.kind` erscheinen die
 * Kategorien in der Seiten-Locale. Unbekannte Rohwerte bleiben deutsch und
 * tragen `lang: 'de'`. Ohne `opts` bleibt die Ausgabe deutsch wie zuvor.
 */
export function toSegments(
	dist: CategoryDistribution | null | undefined,
	opts?: SegmentOptions
): DistSegment[] {
	if (!dist) return [];
	const locale = opts?.locale ?? baseLocale;
	const merged = new Map<string, DistSegment>();
	for (const [raw, share] of Object.entries(dist)
		.filter(([, v]) => typeof v === 'number' && v > 0)
		.sort((x, y) => y[1] - x[1])) {
		const localized =
			locale === baseLocale || !opts?.kind ? null : localizeCategory(raw, opts.kind, locale);
		const useRaw = localized === null;
		const label = capitalize(useRaw ? raw : localized);
		const lang = useRaw && locale !== baseLocale && opts?.kind ? ('de' as const) : undefined;
		const key = `${lang ?? ''}|${label}`;
		const existing = merged.get(key);
		if (existing) merged.set(key, { ...existing, share: existing.share + share });
		else merged.set(key, lang ? { label, share, lang } : { label, share });
	}
	return [...merged.values()].sort((x, y) => y.share - x.share);
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
