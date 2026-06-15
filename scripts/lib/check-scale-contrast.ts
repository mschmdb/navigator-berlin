import { ensureMinContrast, interpolateOklchScale } from './oklch-interpolate.js';

export const BACKGROUND_TOKEN = '#ECEAE0';
export const MIN_CONTRAST_RATIO = 3.0;
export const MAX_CONTRAST_ITERATIONS = 10;

export function buildScaleFamily(
	startHex: string,
	endHex: string,
	backgroundHex: string,
	stages = 5
): readonly string[] {
	const initial = interpolateOklchScale(startHex, endHex, stages);
	const adjustedStart = ensureMinContrast(
		initial[0],
		backgroundHex,
		MIN_CONTRAST_RATIO,
		MAX_CONTRAST_ITERATIONS
	);
	if (adjustedStart.toLowerCase() === initial[0].toLowerCase()) return initial;
	return interpolateOklchScale(adjustedStart, endHex, stages);
}

export interface ScaleFamilyConfig {
	readonly key: 'last' | 'gut' | 'strukturell';
	readonly startHex: string;
	readonly endHex: string;
}

export const SCALE_FAMILY_CONFIGS: readonly ScaleFamilyConfig[] = [
	{ key: 'last', startHex: '#F5DDD5', endHex: '#8C2A14' },
	{ key: 'gut', startHex: '#DDEDDE', endHex: '#1F5A2E' },
	{ key: 'strukturell', startHex: '#DDE1ED', endHex: '#2A3F7C' }
];

export function generateAllScales(
	backgroundHex = BACKGROUND_TOKEN
): Record<'last' | 'gut' | 'strukturell', readonly string[]> {
	return Object.fromEntries(
		SCALE_FAMILY_CONFIGS.map((cfg) => [
			cfg.key,
			buildScaleFamily(cfg.startHex, cfg.endHex, backgroundHex)
		])
	) as Record<'last' | 'gut' | 'strukturell', readonly string[]>;
}
