/**
 * Link-Aktionen der Startseite. Zweitaktionen stehen als Sekundär-Button neben
 * der Primäraktion statt als kleiner Akzent-Textlink, damit sie nicht übersehen
 * werden. Beide teilen Höhe, Schrift und Abstand.
 */
const base =
	'inline-flex min-h-(--target-min) items-center gap-2 rounded border px-4 py-2 text-sm font-medium whitespace-nowrap';

export const ctaPrimary = `${base} border-accent bg-accent text-bg hover:border-ink hover:bg-ink`;

export const ctaSecondary = `${base} border-rule-strong text-ink hover:border-ink`;
