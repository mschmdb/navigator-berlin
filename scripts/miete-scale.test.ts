import { describe, expect, it } from 'vitest';
import { buildScaleFamily, BACKGROUND_TOKEN } from './lib/check-scale-contrast.js';
import { contrastRatio } from './lib/oklch-interpolate.js';
import {
	DOT_CAPABLE_SLUGS,
	dotSpecForSlug
} from '../src/lib/components/atlas/internal/choropleth-dots.js';
import { COLORS } from '../src/lib/components/atlas/internal/colors.js';

const MIETE = [
	COLORS.scaleMiete1,
	COLORS.scaleMiete2,
	COLORS.scaleMiete3,
	COLORS.scaleMiete4,
	COLORS.scaleMiete5
];

function mix(fg: string, bg: string, alpha: number): string {
	const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
	return (
		'#' +
		[0, 1, 2]
			.map((i) =>
				Math.round(ch(fg, i) * alpha + ch(bg, i) * (1 - alpha))
					.toString(16)
					.padStart(2, '0')
			)
			.join('')
	);
}

describe('Bestandsmiete-Skala', () => {
	it('entspricht buildScaleFamily(#DDE1ED, #1A2A5E, Hintergrund)', () => {
		const generated = buildScaleFamily('#DDE1ED', '#1A2A5E', BACKGROUND_TOKEN);
		expect(MIETE.map((h) => h.toLowerCase())).toEqual(generated.map((h) => h.toLowerCase()));
	});

	it('hellste Stufe erfüllt 3:1 gegen den Hintergrund', () => {
		expect(contrastRatio(MIETE[0], BACKGROUND_TOKEN)).toBeGreaterThanOrEqual(3);
	});

	it('jede Symbolfarbe bleibt auf allen Klassen erkennbar: Füllung oder heller Rand erreicht 3:1', () => {
		// Der helle Sprite-Rand (#FFFFFF, buildScoreDotSvg) trägt dort die Erkennbarkeit,
		// wo die Füllung unter 3:1 fällt.
		const symbolColors = new Set(
			DOT_CAPABLE_SLUGS.map((slug) => dotSpecForSlug(slug)?.imageColor).filter(
				(c): c is string => typeof c === 'string'
			)
		);
		expect(symbolColors.size).toBeGreaterThan(1);
		for (const symbol of symbolColors) {
			for (const c of MIETE) {
				const area = mix(c, BACKGROUND_TOKEN, 0.7);
				const best = Math.max(contrastRatio(symbol, area), contrastRatio('#FFFFFF', area));
				expect(best, `${symbol} auf ${c}`).toBeGreaterThanOrEqual(3);
			}
		}
	});
});
