/**
 * Zentrale Partei-Color-Tokens für Wahl-Section (Story 6.3 AC-2).
 *
 * Hex-Werte sind UI-angepasste Varianten der Standard-Parteifarben mit ≥ 3:1
 * Kontrast gegen Inspector-BG (#F5F3EA Cloud-Dancer-Beige), getestet via
 * `wcagAaPasses`. AfD-Blau ist gegen navigator-accent-navy differenziert.
 *
 * Pattern-Variants (`solid`/`stripes`/`dots`/`diagonal`) sind Achromatopsie-
 * Fallback. Werden in `wahl-stacked-bar.svelte` als SVG-pattern-Overlay
 * rendered, damit Bars auch ohne Farbe unterscheidbar bleiben.
 */

export type Pattern = 'solid' | 'stripes' | 'dots' | 'diagonal';

export type ParteiFarbe = {
	hex: string;
	pattern: Pattern;
};

export const INSPECTOR_BG = '#F5F3EA' as const;

export const PARTEI_FARBEN = {
	SPD: { hex: '#A50C1A', pattern: 'solid' },
	CDU: { hex: '#1A1A1A', pattern: 'stripes' },
	CSU: { hex: '#00557A', pattern: 'diagonal' },
	GRÜNE: { hex: '#0F6E2C', pattern: 'dots' },
	FDP: { hex: '#7A6500', pattern: 'diagonal' },
	AfD: { hex: '#004A6E', pattern: 'stripes' },
	'Die Linke': { hex: '#8C2057', pattern: 'solid' },
	BSW: { hex: '#4A1559', pattern: 'dots' },
	'FREIE WÄHLER': { hex: '#8A4200', pattern: 'diagonal' },
	Sonstige: { hex: '#525252', pattern: 'stripes' }
} as const satisfies Record<string, ParteiFarbe>;

export type ParteiKurzname = keyof typeof PARTEI_FARBEN;

const LOOKUP = new Map<string, ParteiKurzname>(
	(Object.keys(PARTEI_FARBEN) as ParteiKurzname[]).map((k) => [k.toLowerCase(), k])
);

function lookupKurzname(label: string): ParteiKurzname {
	return LOOKUP.get(label.toLowerCase()) ?? 'Sonstige';
}

export function parteiColor(label: string): string {
	return PARTEI_FARBEN[lookupKurzname(label)].hex;
}

export function parteiPattern(label: string): Pattern {
	return PARTEI_FARBEN[lookupKurzname(label)].pattern;
}

function expandHex(hex: string): string {
	const trimmed = hex.replace(/^#/, '');
	if (trimmed.length === 3) {
		return trimmed
			.split('')
			.map((c) => c + c)
			.join('');
	}
	return trimmed;
}

function relativeLuminance(hex: string): number {
	const expanded = expandHex(hex);
	const r = Number.parseInt(expanded.slice(0, 2), 16) / 255;
	const g = Number.parseInt(expanded.slice(2, 4), 16) / 255;
	const b = Number.parseInt(expanded.slice(4, 6), 16) / 255;
	const linearize = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
	return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function contrastRatio(fgHex: string, bgHex: string): number {
	const l1 = relativeLuminance(fgHex);
	const l2 = relativeLuminance(bgHex);
	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);
	return (lighter + 0.05) / (darker + 0.05);
}

export function wcagAaPasses(
	fgHex: string,
	bgHex: string,
	size: 'normal' | 'large' = 'normal'
): boolean {
	const ratio = contrastRatio(fgHex, bgHex);
	const threshold = size === 'large' ? 3 : 4.5;
	return ratio >= threshold;
}
