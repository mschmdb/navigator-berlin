/**
 * Locale-Option für die Atlas-Label-Resolver (i18n Block B3a: Layer-Name,
 * Bundle, Section, Score-Dimension, Skala, Legenden-Labels, Formatter).
 *
 * Bewusst ANDERS als `$lib/i18n/message-options.ts` (`toMessageOptions`, das
 * ohne explizite Locale auf `getLocale()` zurückfällt): diese Resolver
 * werden auch von Seiten aufgerufen, die selbst noch NICHT übersetzt sind
 * (Methodik, Lizenzen, Layer-Detailseiten, OG-Pipeline, LLM-Export,
 * Inspector-Panel/Compare-Panel vor B3b/B3c) und müssen dort DE bleiben,
 * unabhängig von der URL-Locale (Boundary Spec i18n B3a: "geteilte
 * Resolver ohne Locale-Angabe liefern DE"). Aufrufer auf der übersetzten
 * Karten-Oberfläche übergeben `{ locale: getLocale() }` explizit.
 */
import type { Locale } from '$lib/paraglide/runtime';

export interface LocaleOptions {
	readonly locale?: Locale;
}

export function toAtlasMessageOptions(o?: LocaleOptions): { locale: Locale } {
	return { locale: o?.locale ?? 'de' };
}

export { assertUnreachable } from '$lib/i18n/message-options.js';
