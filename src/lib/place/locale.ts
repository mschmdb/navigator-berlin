import type { Locale } from '#lib/paraglide/runtime.js';

/** Ohne Angabe gilt DE, wie bei den geteilten Atlas-Resolvern. Seiten übergeben `getLocale()`. */
export interface LocaleOpts {
	readonly locale?: Locale;
}

export function msgOpts(opts?: LocaleOpts): { locale: Locale } {
	return { locale: opts?.locale ?? 'de' };
}

export function numberLocale(opts?: LocaleOpts): 'de-DE' | 'en-GB' {
	return msgOpts(opts).locale === 'en' ? 'en-GB' : 'de-DE';
}

/** Nachkommastellen und Tausendertrennung nach Sprache. */
export function numberFormat(digits: number, opts?: LocaleOpts): Intl.NumberFormat {
	return new Intl.NumberFormat(numberLocale(opts), {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	});
}
