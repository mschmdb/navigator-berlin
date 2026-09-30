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

	it('EN-Templates spiegeln DE (IDs, applicableTo, requires, Slots)', async () => {
		const loaded = await loadAllFaqTemplates();
		const slotsOf = (text: string) =>
			[...text.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map((x) => x[1]!).sort();
		for (const de of loaded.filter((l) => l.locale === 'de')) {
			const en = loaded.find((l) => l.locale === 'en' && l.cluster === de.cluster);
			expect(en, `EN-Datei fehlt für ${de.cluster}`).toBeDefined();
			expect(en!.file.templates.map((t) => t.id)).toEqual(de.file.templates.map((t) => t.id));
			for (const deT of de.file.templates) {
				const enT = en!.file.templates.find((t) => t.id === deT.id)!;
				expect(enT.applicableTo, deT.id).toEqual(deT.applicableTo);
				expect(enT.requires, deT.id).toEqual(deT.requires);
				expect(slotsOf(enT.question), `${deT.id} question`).toEqual(slotsOf(deT.question));
				expect(slotsOf(enT.answer), `${deT.id} answer`).toEqual(slotsOf(deT.answer));
				expect(enT.editorialNote, deT.id).toBeUndefined();
			}
		}
	});

	it('Anti-Stigma-Disclaimer existiert auch in EN', async () => {
		const loaded = await loadAllFaqTemplates();
		const en = loaded.find((l) => l.locale === 'en' && l.cluster === 'wohnen');
		const disclaimer = en?.file.templates.find((t) => t.id === 'wohnen-stigma-disclaimer');
		expect(disclaimer).toBeDefined();
		expect(disclaimer!.applicableTo).toEqual(expect.arrayContaining(['bezirk', 'kiez']));
	});
});
