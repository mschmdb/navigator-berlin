import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';
import { readRegionDisplayNames } from '../../../src/lib/data/region-display-names.js';
import { fallbackNameFromSlug } from '../../../src/lib/data/region-display-names.js';

/**
 * #96: Die committeten Profile tragen den GeoJSON-Anzeigenamen („Südliche Luisenstadt“),
 * nicht die Slug-Rekonstruktion („Suedliche Luisenstadt“), weder im Frontmatter noch im Text.
 */
const TYPES = ['kiez', 'bezirk'] as const;

function profileFiles(type: (typeof TYPES)[number]): string[] {
	const dir = join(process.cwd(), 'src/lib/content', `${type}-profile`);
	return readdirSync(dir)
		.filter((f) => f.endsWith('.md'))
		.map((f) => join(dir, f));
}

describe('Profil-Namen (#96)', async () => {
	const names = await readRegionDisplayNames();

	for (const type of TYPES) {
		it(`${type}: Frontmatter-Name ist der Anzeigename`, () => {
			const map = type === 'kiez' ? names.kiez : names.bezirk;
			const wrong: string[] = [];
			for (const file of profileFiles(type)) {
				const { data } = matter(readFileSync(file, 'utf-8'));
				const expected = map.get(String(data.slug));
				if (expected !== undefined && data.name !== expected) wrong.push(`${data.slug}: ${data.name}`);
			}
			expect(wrong).toEqual([]);
		});

		it(`${type}: Text enthält keine Slug-Rekonstruktion eines Namens`, () => {
			const all = [...names.kiez, ...names.bezirk];
			const wrong: string[] = [];
			for (const file of profileFiles(type)) {
				const { content } = matter(readFileSync(file, 'utf-8'));
				for (const [slug, display] of all) {
					const rebuilt = fallbackNameFromSlug(slug);
					if (rebuilt !== display && content.includes(rebuilt)) {
						wrong.push(`${file.split('/').pop()}: ${rebuilt}`);
					}
				}
			}
			expect(wrong).toEqual([]);
		});
	}
});
