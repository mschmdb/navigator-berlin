import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOGO_SIZE, renderOrganizationLogo } from './generate-organization-logo.js';

const root = path.resolve(__dirname, '..');

function pngSize(png: Buffer): { width: number; height: number } {
	return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

describe('renderOrganizationLogo', () => {
	it('rendert ein quadratisches 512x512-PNG', () => {
		const svg = readFileSync(path.join(root, 'static', 'logo-pixel.svg'), 'utf-8');
		const png = renderOrganizationLogo(svg);
		expect(png.subarray(1, 4).toString('ascii')).toBe('PNG');
		expect(pngSize(png)).toEqual({ width: LOGO_SIZE, height: LOGO_SIZE });
	});

	it('die committete Datei entspricht dem frischen Render (sonst `pnpm logo:organization`)', () => {
		const svg = readFileSync(path.join(root, 'static', 'logo-pixel.svg'), 'utf-8');
		const committed = readFileSync(path.join(root, 'static', 'logo-organization.png'));
		expect(committed.equals(renderOrganizationLogo(svg))).toBe(true);
	});

	it('wirft bei nicht quadratischer Vorlage', () => {
		const wide =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><rect width="200" height="100"/></svg>';
		expect(() => renderOrganizationLogo(wide)).toThrow(/512x512/);
	});
});
