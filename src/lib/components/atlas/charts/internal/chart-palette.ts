import type { SeverityLevel } from '../../inspector-panel/internal/value-severity-mapping.js';

// Stigma-sichere Chart-Palette (ADR-014 Abschnitt 5). Alle Farben als CSS-Token-Var,
// kein Inline-Hex pro Primitive. Severity-Tokens + kategorische Plex-Cartography-Hues
// stammen aus app.css (@theme inline / --severity-*, --chart-cat-*).

/** Severity → CSS-Token-Var. Reuse der Value-Chip-Tokens. */
export function severityColor(severity: SeverityLevel): string {
	return `var(--severity-${severity})`;
}

/** Neutraler Token: Default für categorical-neutrale / Stigma-Layer (keine Wertung). */
export const NEUTRAL_COLOR = 'var(--severity-neutral)';

/** Kategorische, wertungsfreie Sequenz (kein Rot-Grün-Sprung). */
export const CATEGORICAL_COLORS = [
	'var(--chart-cat-1)',
	'var(--chart-cat-2)',
	'var(--chart-cat-3)',
	'var(--chart-cat-4)',
	'var(--chart-cat-5)',
	'var(--chart-cat-6)'
] as const;

export function categoricalColor(index: number): string {
	const len = CATEGORICAL_COLORS.length;
	return CATEGORICAL_COLORS[((index % len) + len) % len];
}
