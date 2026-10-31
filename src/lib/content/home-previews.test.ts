import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { HOME_PREVIEWS, HOME_PREVIEW_LOCALES, homePreviewSrc } from './home-previews.js';

const previews = Object.values(HOME_PREVIEWS);

describe('HOME_PREVIEWS', () => {
	it('führt vier Vorschauen', () => {
		expect(previews.map((p) => p.name).sort()).toEqual(['finder', 'hitze', 'kiez-score', 'wahlen']);
	});

	it.each(previews)('$name: Pfad beginnt mit /', (p) => {
		expect(p.path.startsWith('/')).toBe(true);
	});

	it('Hitze und Wahlen haben das Kachel-Format 1200x1000', () => {
		for (const p of [HOME_PREVIEWS.hitze, HOME_PREVIEWS.wahlen]) {
			expect({ width: p.width, height: p.height }).toEqual({ width: 1200, height: 1000 });
		}
	});

	it('Bilddatei je Sprache unter /home/{locale}/', () => {
		expect(homePreviewSrc(HOME_PREVIEWS.hitze, 'de')).toBe('/home/de/hitze.webp');
		expect(homePreviewSrc(HOME_PREVIEWS.hitze, 'en')).toBe('/home/en/hitze.webp');
	});

	const cases = previews.flatMap((p) => HOME_PREVIEW_LOCALES.map((locale) => ({ ...p, locale })));
	it.each(cases)('$name ($locale): Datei existiert mit passenden Maßen', async (p) => {
		const file = join(process.cwd(), 'static', homePreviewSrc(p, p.locale));
		expect(existsSync(file)).toBe(true);
		const meta = await sharp(file).metadata();
		expect({ width: meta.width, height: meta.height }).toEqual({
			width: p.width,
			height: p.height
		});
	});
});
