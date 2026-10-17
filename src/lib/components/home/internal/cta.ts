/**
 * Link-Aktionen der Startseite. Zweitaktionen stehen als Sekundär-Button neben
 * der Primäraktion statt als kleiner Akzent-Textlink, damit sie nicht übersehen
 * werden. Beide teilen Höhe, Schrift und Abstand. Auf schmalen Bildschirmen
 * dürfen Texte umbrechen (WCAG 1.4.10), ab `sm` bleiben feste Labels einzeilig.
 */
const base =
	'inline-flex min-h-(--target-min) max-w-full items-center gap-2 rounded border px-4 py-2 text-sm font-medium';

const primary = 'border-accent bg-accent text-bg hover:border-ink hover:bg-ink';
const secondary = 'border-rule-strong text-ink hover:border-ink';

export const ctaPrimary = `${base} ${primary} sm:whitespace-nowrap`;

export const ctaSecondary = `${base} ${secondary} sm:whitespace-nowrap`;

/** Für Aktionen mit dynamischem Namen, die in schmalen Spalten stehen. */
export const ctaSecondaryWrap = `${base} ${secondary}`;
