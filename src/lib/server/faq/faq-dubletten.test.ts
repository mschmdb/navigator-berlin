import { describe, it, expect } from 'vitest';
import { loadAllFaqTemplates } from './load-templates.js';

/**
 * #100: Kiez- und Bezirks-FAQ dürfen keine inhaltsgleichen Fragen tragen
 * (z. B. „Wie laut“ neben „Wie ruhig und sauber“). Jedes Kiez- und
 * Bezirks-Template nennt sein Thema (`topic`); pro Seitentyp und Sprache
 * kommt jedes Thema nur einmal vor.
 */
describe('FAQ-Templates ohne Dubletten (#100)', () => {
	for (const pageType of ['kiez', 'bezirk'] as const) {
		it(`jedes ${pageType}-Template hat ein Thema`, async () => {
			const loaded = await loadAllFaqTemplates();
			const ohne = loaded.flatMap(({ file }) =>
				file.templates.filter((t) => t.applicableTo.includes(pageType) && !t.topic).map((t) => t.id)
			);
			expect(ohne).toEqual([]);
		});

		it(`jedes Thema kommt für ${pageType} nur einmal vor`, async () => {
			const loaded = await loadAllFaqTemplates();
			const seen = new Map<string, string>();
			const dupes: string[] = [];
			for (const { locale, file } of loaded) {
				for (const t of file.templates) {
					if (!t.applicableTo.includes(pageType) || !t.topic) continue;
					const key = `${locale}|${t.topic}`;
					const prev = seen.get(key);
					if (prev) dupes.push(`${prev} + ${t.id} (${key})`);
					else seen.set(key, t.id);
				}
			}
			expect(dupes).toEqual([]);
		});
	}
});
