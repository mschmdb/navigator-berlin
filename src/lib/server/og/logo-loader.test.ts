import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadLogoDataUri, prepareLogoSvg } from './logo-loader';

const ROOT = process.cwd();

function viewBoxOf(svg: string): [number, number, number, number] {
	const match = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/);
	if (!match) throw new Error('keine viewBox');
	return [Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4])];
}

describe('prepareLogoSvg', () => {
	it('umschließt mit der viewBox jede Zelle der Bildmarke', async () => {
		const raw = await readFile(path.join(ROOT, 'static', 'logo-mark-header.svg'), 'utf-8');
		const svg = prepareLogoSvg(raw);
		const [x, y, w, h] = viewBoxOf(svg);
		const cells = [...svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)"/g)];
		expect(cells.length).toBeGreaterThan(0);
		for (const [, cx, cy, cw] of cells) {
			expect(Number(cx)).toBeGreaterThanOrEqual(x);
			expect(Number(cy)).toBeGreaterThanOrEqual(y);
			expect(Number(cx) + Number(cw)).toBeLessThanOrEqual(x + w);
			expect(Number(cy) + Number(cw)).toBeLessThanOrEqual(y + h);
		}
	});

	it('zieht die viewBox auf die Bildmarke zusammen, statt Leerraum mitzuschleppen', async () => {
		const raw = await readFile(path.join(ROOT, 'static', 'logo-mark-header.svg'), 'utf-8');
		const [x, y, w, h] = viewBoxOf(prepareLogoSvg(raw));
		expect(x).toBeGreaterThan(0);
		expect(y).toBeGreaterThan(0);
		expect(w).toBeLessThan(100);
		expect(h).toBeLessThan(100);
	});

	it('behält die volle viewBox, wenn die Datei keine Zellen enthält', () => {
		const svg = prepareLogoSvg('<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="4"/></svg>');
		expect(viewBoxOf(svg)).toEqual([0, 0, 100, 100]);
	});

	it('löst CSS-Custom-Properties auf, die resvg nicht kennt', () => {
		const svg = prepareLogoSvg(
			'<svg viewBox="0 0 100 100"><rect x="1" y="1" width="2" height="2" fill="var(--accent, #2A3F7C)"/></svg>'
		);
		expect(svg).toContain('fill="#2A3F7C"');
		expect(svg).not.toContain('var(');
	});

	it('macht eine Grundfläche transparent, damit sie nicht gegen das Panel schlägt', () => {
		const svg = prepareLogoSvg(
			'<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#ECEAE0" /><rect x="1" y="1" width="2" height="2" fill="#000"/></svg>'
		);
		expect(svg).toContain('<rect width="100" height="100" fill="transparent" />');
	});
});

describe('loadLogoDataUri', () => {
	it('liefert die Bildmarke als base64-Data-URI', async () => {
		const uri = await loadLogoDataUri(ROOT);
		expect(uri.startsWith('data:image/svg+xml;base64,')).toBe(true);
		const decoded = Buffer.from(uri.split(',')[1], 'base64').toString('utf-8');
		expect(decoded).toContain('<svg');
		expect(decoded).not.toContain('var(');
	});
});
