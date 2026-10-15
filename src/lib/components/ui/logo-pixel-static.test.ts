import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderPixelSvg } from '../../../../scripts/generate-pixel-logo';

describe('static/logo-pixel.svg', () => {
	it('entspricht dem Generator, damit Footer und Header nicht auseinanderlaufen', () => {
		const file = readFileSync('static/logo-pixel.svg', 'utf-8');
		expect(file).toBe(renderPixelSvg());
	});
});
