/**
 * Zentrale Zahlen-/Prozent-/Datums-Formatter fuer das Wahlportal (i18n
 * Block B). Ersetzt die bisherigen `.toFixed(1).replace('.', ',')`- und
 * `toLocaleString('de-DE')`-Aufrufe direkt in den Komponenten/Buildern,
 * damit EN- und DE-Ausgabe an EINER Stelle divergieren.
 *
 * Format-Entscheidungen (Matze 26.09.2026, Spec i18n Block B):
 * - DE: Komma als Dezimaltrennzeichen, Leerzeichen vor `%`, „Pp." fuer
 *   Prozentpunkte (Grossbuchstabe, Punkt).
 * - EN: Punkt als Dezimaltrennzeichen, kein Leerzeichen vor `%`, „pp"
 *   (klein) fuer Prozentpunkte, mit Leerzeichen davor.
 * - Beide Locales: echtes Minuszeichen (U+2212, kein Bindestrich/U+00B1)
 *   fuer negative Deltas.
 *
 * Locale-Aufloesung: explizites `{ locale }` hat Vorrang, sonst
 * `getLocale()` (Paraglide-Runtime, URL-basiert). TS-Builder ohne
 * Component-Kontext (z. B. server-seitige Aggregation) uebergeben
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
	// "-0,0"/"-0.0" vermeiden: prueft das GERUNDETE Ergebnis (`Number(fixed)
	// === 0`), nicht das rohe `value` -- ein Wert wie `-0.04` rundet auf
	// `decimals: 1` NICHT auf 0 und behaelt sein Vorzeichen, waehrend `-0.0001`
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
	const numStr =
		decimals === 0 ? String(Math.round(pct)) : decimalString(pct, 1, locale);
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
 * Datum in `Europe/Berlin`, locale-abhaengig formatiert: `DD.MM.YYYY` (de,
 * identisch zu `formatBerlinDate`) bzw. `D MMMM YYYY` (en, z. B. `21
 * September 2026`, ausgeschriebener Monat statt `'short'` -- Review-Fund:
 * `'short'` ist ICU-Versions-abhaengig zwischen "Sep" und "Sept" und damit
 * nicht stabil). Fuer DE-Aufrufer ausserhalb des Wahlportals bleibt
 * `$lib/utils/format-berlin-date.ts` die eigenstaendige Quelle (Boundary:
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
