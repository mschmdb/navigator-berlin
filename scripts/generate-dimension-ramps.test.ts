import { describe, expect, it } from 'vitest';
import { buildScaleFamily, BACKGROUND_TOKEN } from './lib/check-scale-contrast.js';
import { hexToOklch, oklchToHex } from './lib/oklch-interpolate.js';
import { DIMENSION_RAMPS } from '../src/lib/components/atlas/internal/dimension-ramps.js';

// Endanker-Hues der Dimension-Rampen (OKLCH). Änderungen hier UND im Modul.
const HUES: Record<string, number> = {
	'ruhe-luft': 238,
	mobilitaet: 308,
	versorgung: 85,
	wohnschutz: 193,
	kultur: 350
};

/**
 * Rezept: Probe-Rampe mit Endanker L 0.42 bauen, um den kontrast-erzwungenen
 * Start-L zu kennen (das 3:1-Gate dunkelt helle Hues ein), dann den Endanker
 * auf Start-L − 0.20 setzen. So erreicht jede Rampe die Spannweite der
 * Bestands-Familien (ΔL ≈ 0.05 je Stufe), egal wie stark der Start gestaucht wurde.
 */
function generateRamp(hue: number): readonly string[] {
	const start = oklchToHex({ l: 0.86, c: 0.035, h: hue });
	const probe = buildScaleFamily(start, oklchToHex({ l: 0.42, c: 0.11, h: hue }), BACKGROUND_TOKEN);
	const endL = Math.max(0.3, hexToOklch(probe[0]).l - 0.2);
	return buildScaleFamily(start, oklchToHex({ l: endL, c: 0.11, h: hue }), BACKGROUND_TOKEN);
}

describe('Dimension-Rampen bleiben synchron mit der OKLCH-Build-Infra', () => {
	it.each(Object.entries(HUES))('%s regeneriert byte-gleich aus Hue %d', (key, hue) => {
		const generated = generateRamp(hue).map((hex) => hex.toUpperCase());
		const stored = DIMENSION_RAMPS[key as keyof typeof DIMENSION_RAMPS].map((hex) =>
			hex.toUpperCase()
		);
		expect(stored).toEqual(generated);
	});
});
