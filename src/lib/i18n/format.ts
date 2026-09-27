/**
 * Zentrale Zahlen-/Prozent-/Datums-Formatter für das Wahlportal (i18n
 * Block B). Ersetzt die bisherigen `.toFixed(1).replace('.', ',')`- und
 * `toLocaleString('de-DE')`-Aufrufe direkt in den Komponenten/Buildern,
 * damit EN- und DE-Ausgabe an EINER Stelle divergieren.
 *
 * Format-Entscheidungen (Matze 26.09.2026, Spec i18n Block B):
 * - DE: Komma als Dezimaltrennzeichen, Leerzeichen vor `%`, „Pp." für
 *   Prozentpunkte (Grossbuchstabe, Punkt).
 * - EN: Punkt als Dezimaltrennzeichen, kein Leerzeichen vor `%`, „pp"
 *   (klein) für Prozentpunkte, mit Leerzeichen davor.
 * - Beide Locales: echtes Minuszeichen (U+2212, kein Bindestrich/U+00B1)
 *   für negative Deltas.
 *
 * Locale-Auflösung: explizites `{ locale }` hat Vorrang, sonst
 * `getLocale()` (Paraglide-Runtime, URL-basiert). TS-Builder ohne
 * Component-Kontext (z. B. server-seitige Aggregation) übergeben
 * `{ locale }` explizit statt sich auf den globalen Request-Kontext zu
 * verlassen (Boundary: „Auswertung beim Aufruf").
 */
import { getLocale, type Locale } from '$lib/paraglide/runtime';

export interface LocaleFormatOptions {
	readonly locale?: Locale;
}

function resolveLocale(locale?: Locale): Locale {
	return locale ?? getLocale();
}

function decimalString(value: number, decimals: number, locale: Locale): string {
	const fixed = value.toFixed(decimals);
	// "-0,0"/"-0.0" vermeiden: prüft das GERUNDETE Ergebnis (`Number(fixed)
	// === 0`), nicht das rohe `value` -- ein Wert wie `-0.04` rundet auf
	// `decimals: 1` NICHT auf 0 und behält sein Vorzeichen, während `-0.0001`
	// oder `-0` selbst das Minuszeichen verlieren soll.
	const normalized = fixed.startsWith('-') && Number(fixed) === 0 ? fixed.slice(1) : fixed;
	return locale === 'de' ? normalized.replace('.', ',') : normalized;
}

/**
 * Anteil (0..1) als Prozent-String, z. B. `28,2 %` (de) / `28.2%` (en).
 * `decimals: 0` rundet ganzzahlig (Karten-Legenden).
 */
export function formatPercent(
	anteil: number,
	opts?: LocaleFormatOptions & { decimals?: 0 | 1 }
): string {
	const locale = resolveLocale(opts?.locale);
	const decimals = opts?.decimals ?? 1;
	const pct = anteil * 100;
	// Kein Vor-Runden über `Math.round(pct * 10) / 10`: das rundet Werte wie
	// 0.15 abweichend von `toFixed` (0.0015 -> "0,2 %" statt "0,1 %", Review-
	// Fund) -- `toFixed(decimals)` direkt auf `pct` ist exakt die alte, vor
	// dieser Konsolidierung genutzte Rundung (`pct.toFixed(1)` in
	// `winner-map-data.ts`/`wahl-bezirk-choropleth.svelte` etc.).
	const numStr = decimals === 0 ? String(Math.round(pct)) : decimalString(pct, 1, locale);
	return locale === 'de' ? `${numStr} %` : `${numStr}%`;
}

/**
 * Prozentpunkt-Differenz mit echtem Vorzeichen, z. B. `+10,2 Pp.` (de) /
 * `+10.2 pp` (en). `deltaPp` ist bereits in Prozentpunkten (nicht 0..1).
 *
 * DE bleibt Byte-identisch zum vormaligen `formatDeltaLabel` (Review-Fund:
 * das bestimmte das Vorzeichen schon immer aus dem UNGERUNDETEN `deltaPp`,
 * auch für Werte, die auf "0,0" runden, z. B. `-0.04` -> "−0,0 Pp." -- das
 * bleibt hier bewusst erhalten). Für EN wird das Vorzeichen dagegen am
 * GERUNDETEN Betrag bestimmt: rundet ein Delta auf "0.0", entfällt das
 * Vorzeichen (verhindert ein neu eingeführtes "-0.0 pp"/"+0.0 pp").
 */
export function formatPercentagePointsDelta(deltaPp: number, opts?: LocaleFormatOptions): string {
	const locale = resolveLocale(opts?.locale);
	const abs = decimalString(Math.abs(deltaPp), 1, locale);
	if (locale === 'de') {
		const sign = deltaPp < 0 ? '−' : '+';
		return `${sign}${abs} Pp.`;
	}
	const isZero = Number(abs) === 0;
	const sign = isZero ? '' : deltaPp < 0 ? '−' : '+';
	return `${sign}${abs} pp`;
}

/** Ganzzahl mit Locale-Tausendertrennzeichen, z. B. `1.234` (de) / `1,234` (en). */
export function formatCount(n: number, opts?: LocaleFormatOptions): string {
	const locale = resolveLocale(opts?.locale);
	return n.toLocaleString(locale === 'de' ? 'de-DE' : 'en-GB');
}

/**
 * Dezimalzahl mit Locale-Tausendertrennzeichen UND fester maximaler
 * Nachkommastellenzahl, z. B. `formatDecimal(24.567, { maximumFractionDigits:
 * 1 })` -> `24,6` (de) / `24.6` (en). Ersetzt die früher direkt in den
 * Atlas-Formattern verstreuten `new Intl.NumberFormat('de-DE', {
 * maximumFractionDigits: ... })`-Aufrufe (i18n Block B3a, Boundary
 * "Komma-Hacks auf format.ts").
 *
 * `minimumFractionDigits` ist optional und NICHT identisch mit
 * `maximumFractionDigits`: manche Alt-Call-Sites (z. B. `formatDistanceDe`,
 * vormals `.toFixed(1)`) zeigten IMMER eine feste Nachkommastellenzahl (z. B.
 * `1,0 km`, nicht `1 km`), andere (PET/Einwohnerdichte, vormals
 * `Intl.NumberFormat` ohne `minimumFractionDigits`) rundeten ganze Zahlen
 * schon immer ohne Nachkommastellen. Beide Alt-Verhalten bleiben über diesen
 * einen Parameter erhalten.
 */
export function formatDecimal(
	value: number,
	opts?: LocaleFormatOptions & { maximumFractionDigits?: number; minimumFractionDigits?: number }
): string {
	const locale = resolveLocale(opts?.locale);
	const min = opts?.minimumFractionDigits;
	// `Intl.NumberFormat` wirft ein RangeError, wenn `minimumFractionDigits` >
	// `maximumFractionDigits` (Review-Fund) -- z. B. bei
	// `formatDecimal(x, { minimumFractionDigits: 1 })` ohne explizites `max`
	// (Default 3 wäre hier unproblematisch, aber ein Aufrufer mit z. B.
	// `{ minimumFractionDigits: 4 }` hätte den Default 3 unterlaufen).
	// `max` wird deshalb nie kleiner als `min` gewählt.
	const max = Math.max(opts?.maximumFractionDigits ?? 3, min ?? 0);
	const numFmt = new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-GB', {
		maximumFractionDigits: max,
		minimumFractionDigits: min
	});
	return numFmt.format(value);
}

/**
 * Datum in `Europe/Berlin`, locale-abhängig formatiert: `DD.MM.YYYY` (de,
 * identisch zu `formatBerlinDate`) bzw. `D MMMM YYYY` (en, z. B. `21
 * September 2026`, ausgeschriebener Monat statt `'short'` -- Review-Fund:
 * `'short'` ist ICU-Versions-abhängig zwischen "Sep" und "Sept" und damit
 * nicht stabil). Für DE-Aufrufer ausserhalb des Wahlportals bleibt
 * `$lib/utils/format-berlin-date.ts` die eigenständige Quelle (Boundary:
 * „Keine anderen Seiten übersetzen").
 */
export function formatWahlDate(iso: string, opts?: LocaleFormatOptions): string {
	const locale = resolveLocale(opts?.locale);
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	if (locale === 'de') {
		return d.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			timeZone: 'Europe/Berlin'
		});
	}
	return d.toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'Europe/Berlin'
	});
}

/**
 * Neutrales Kurzdatum ohne feste Format-Optionen, z. B. `1.1.2025` (de) /
 * `01/01/2025` (en-GB). DE ruft `toLocaleDateString('de-DE')` OHNE weitere
 * Optionen auf -- bewusst NICHT `formatWahlDate` (das erzwingt `2-digit`
 * Tag/Monat + `Europe/Berlin`, z. B. `01.01.2025` statt `1.1.2025`, andere
 * Zeitzonen-Semantik). Ersetzt Alt-Aufrufer wie
 * `kiez-score-dimension-row.svelte`s vormals fest auf `'de-DE'` verdrahtetes
 * `toLocaleDateString`, DE bleibt dadurch Zeichen-für-Zeichen gleich.
 */
export function formatDate(iso: string, opts?: LocaleFormatOptions): string {
	const locale = resolveLocale(opts?.locale);
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB');
}

/**
 * Kompaktes Datum mit abgekürztem Monat, `Europe/Berlin`: `15. Mai 2026` (de)
 * / `15 May 2026` (en). i18n Block B2: ersetzt das bisherige, in
 * `home-updates-teaser.svelte` fest auf `de-DE` verdrahtete
 * `toLocaleDateString`.
 */
export function formatShortDate(iso: string, opts?: LocaleFormatOptions): string {
	const locale = resolveLocale(opts?.locale);
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	// Review-Fund (i18n Block B2): KEIN `timeZone: 'Europe/Berlin'` -- die
	// bisherige `home-updates-teaser.svelte`-Formatierung setzte nie eine
	// Zeitzone (Host-Zeitzone), ein hinzugefügtes `timeZone` hätte das
	// Datum je nach Host-TZ (z. B. UTC in Production) springen lassen. DE
	// bleibt damit exakt Byte-identisch zum Alt-Verhalten.
	return d.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});
}
