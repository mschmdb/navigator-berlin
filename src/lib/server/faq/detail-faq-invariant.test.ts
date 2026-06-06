import { describe, it, expect } from 'vitest';
import { loadAllFaqTemplates } from './load-templates.js';

/**
 * Story 11.2: Detailseiten-FAQ (bezirk/kiez) darf keine reinen Erklär-Templates
 * (requires: []) mehr enthalten. Erklär-Inhalte gehören auf Layer-Seiten.
 * Ausnahme: bewusst auf Detailseiten gehaltene Kontext-/Disclaimer-Templates
 * (ADR-015 Anti-Stigma) — diese sind kein zitierfähiger Q&A-Wettbewerb, sondern
 * ethisch notwendiger Kontext.
 */
const DETAIL_EXPLAINER_ALLOWLIST = new Set(['wohnen-stigma-disclaimer']);

describe('Detail-FAQ-Invariante (Story 11.2)', () => {
	it('kein bezirk/kiez-Template ohne requires-Bezug (außer Allowlist)', async () => {
		const loaded = await loadAllFaqTemplates();
		const offenders: string[] = [];
		for (const { file } of loaded) {
			for (const t of file.templates) {
				const onDetail = t.applicableTo.includes('bezirk') || t.applicableTo.includes('kiez');
				if (!onDetail) continue;
				if (t.requires.length === 0 && !DETAIL_EXPLAINER_ALLOWLIST.has(t.id)) {
					offenders.push(t.id);
				}
			}
		}
		expect(offenders).toEqual([]);
	});

	it('Erklär-Templates bleiben auf Layer-Seiten erreichbar', async () => {
		const loaded = await loadAllFaqTemplates();
		const explainerOnLayer = loaded
			.flatMap((l) => l.file.templates)
			.filter((t) => t.requires.length === 0 && t.applicableTo.includes('layer'));
		// Nach der Migration tragen die verschobenen Erklär-Templates layer-Scope.
		expect(explainerOnLayer.length).toBeGreaterThan(5);
	});
});
