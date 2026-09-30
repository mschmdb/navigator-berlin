import { expect } from '@playwright/test';
import { loadAllFaqTemplates } from '../../src/lib/server/faq/load-templates';
import { computeFaqPositions, faqPositionKey } from '../../src/lib/server/faq/faq-positions';
import type { PageType, TemplateLocale } from '../../src/lib/server/faq/template-schema';

function questionPattern(question: string): RegExp {
	const parts = question.split(/\{[^}]*\}/).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
	return new RegExp(`^${parts.join('.*')}$`, 's');
}

/**
 * Ordnet die angezeigten FAQ-Fragen den Templates zu und liefert deren IDs
 * in Seitenreihenfolge. Prüft, dass die Folge der YAML-Position folgt.
 */
export async function expectFaqInYamlOrder(
	questions: readonly string[],
	pageType: PageType,
	locale: TemplateLocale
): Promise<string[]> {
	const loaded = await loadAllFaqTemplates();
	const positions = computeFaqPositions(loaded);
	const candidates = loaded
		.filter((t) => t.locale === locale)
		.flatMap(({ cluster, file }) =>
			file.templates
				.filter((t) => t.applicableTo.includes(pageType))
				.map((t) => ({
					id: t.id,
					position: positions.get(faqPositionKey(cluster, t.id)) ?? -1,
					pattern: questionPattern(t.question)
				}))
		);
	const ids: string[] = [];
	const found: number[] = [];
	for (const q of questions) {
		const hit = candidates.find((c) => c.pattern.test(q.trim()));
		expect(hit, `Frage ohne Template: ${q}`).toBeDefined();
		ids.push(hit!.id);
		found.push(hit!.position);
	}
	expect(found).toEqual([...found].sort((a, b) => a - b));
	return ids;
}
