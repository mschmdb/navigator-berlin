/**
 * Geteilter Options-Typ + Helper für die kleinen, locale-abhängigen
 * Message-Resolver-Module der Startseite/Shell (i18n Block B2 Review-Fund:
 * `toOptions()` + eigenes `*Options`-Interface war 6x fast identisch
 * kopiert in `meta-links.ts`, `home-data-sources.ts`,
 * `home-featured-bezirke.ts`, `home-layer-teasers.ts`,
 * `home-quick-links.ts`, `screenshot-manifest.ts`).
 *
 * `wahl-labels.ts` (Block B) bleibt bewusst unangetastet -- eigener Scope,
 * kein Teil dieser Aufräum-Runde.
 */
import type { Locale } from '$lib/paraglide/runtime';

export interface LocaleOptions {
	readonly locale?: Locale;
}

/** Paraglide-Message-Aufruf-Option: `undefined` heißt "aktuelle Locale
 * (`getLocale()`)", sonst explizite Locale. */
export function toMessageOptions(o?: LocaleOptions): { locale: Locale } | undefined {
	return o?.locale ? { locale: o.locale } : undefined;
}

/**
 * Exhaustiveness-Guard für Resolver-`switch`-Blöcke über eine ID-Union aus
 * einem `as const`-Datenarray: wird der Union später (neuer Eintrag im
 * Array) ein Case im Switch nicht ergänzt, meldet TypeScript hier einen
 * Compile-Fehler (`x` ist nicht `never`) statt eines stillen `default`.
 */
export function assertUnreachable(x: never): never {
	throw new Error(`Unhandled id: ${String(x)}`);
}
