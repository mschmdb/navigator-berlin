import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { svgToPng, ttfName } from './raster';

const PAPER = '<rect width="200" height="100" fill="#efe6d2"/>';
const svg = (inner: string): string =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">${PAPER}${inner}</svg>`;

async function inkPixels(png: Buffer): Promise<number> {
	const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
	let n = 0;
	for (let i = 0; i < data.length; i += info.channels) if (data[i] < 120) n++;
	return n;
}

describe('svgToPng', () => {
	it('liefert ein PNG in der Zielbreite', async () => {
		const png = await svgToPng(svg(''), 400);
		expect(png.subarray(1, 4).toString()).toBe('PNG');
		const meta = await sharp(png).metadata();
		expect(meta.width).toBe(400);
		expect(meta.height).toBe(200);
	});

	it('setzt Text in Jost 400 und 900 ohne Systemschriften', async () => {
		for (const weight of [400, 900]) {
			const png = await svgToPng(
				svg(
					`<text x="10" y="70" font-family="'Jost', sans-serif" font-weight="${weight}" font-size="60" fill="#26221e">28 %</text>`
				),
				200
			);
			expect(await inkPixels(png)).toBeGreaterThan(500);
		}
	});

	it('Jost 900 schwärzt mehr Fläche als Jost 400', async () => {
		const ink = async (w: number): Promise<number> =>
			inkPixels(
				await svgToPng(
					svg(
						`<text x="10" y="70" font-family="Jost" font-weight="${w}" font-size="60" fill="#26221e">28 %</text>`
					),
					200
				)
			);
		expect(await ink(900)).toBeGreaterThan((await ink(400)) * 1.3);
	});
});

describe('ttfName', () => {
	it('hängt den Inhalt der Quelldatei an, damit neue Jost-Versionen neu entpackt werden', () => {
		const a = ttfName(900, Buffer.from('jost v1'));
		expect(a).toMatch(/^jost-latin-900-normal-[0-9a-f]{16}\.ttf$/);
		expect(ttfName(900, Buffer.from('jost v1'))).toBe(a);
		expect(ttfName(900, Buffer.from('jost v2'))).not.toBe(a);
	});
});
