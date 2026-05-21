import { describe, expect, it } from 'vitest';
import {
	severityColor,
	categoricalColor,
	CATEGORICAL_COLORS,
	NEUTRAL_COLOR
} from './chart-palette.js';

describe('chart-palette', () => {
	it('severityColor mappt auf CSS-Token-Var (kein Inline-Hex)', () => {
		expect(severityColor('neutral')).toBe('var(--severity-neutral)');
		expect(severityColor('success-soft')).toBe('var(--severity-success-soft)');
		expect(severityColor('danger')).toBe('var(--severity-danger)');
		// Stigma-Disziplin: keine Hex-Werte hardcoded.
		expect(severityColor('warning')).not.toMatch(/#/);
	});

	it('NEUTRAL_COLOR ist der neutrale Token', () => {
		expect(NEUTRAL_COLOR).toBe('var(--severity-neutral)');
	});

	it('categoricalColor wrappt zyklisch über die Palette', () => {
		expect(categoricalColor(0)).toBe(CATEGORICAL_COLORS[0]);
		expect(categoricalColor(CATEGORICAL_COLORS.length)).toBe(CATEGORICAL_COLORS[0]);
		expect(CATEGORICAL_COLORS.every((c) => c.startsWith('var(--chart-cat-'))).toBe(true);
	});
});
