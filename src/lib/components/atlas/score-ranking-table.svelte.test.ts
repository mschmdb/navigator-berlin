import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ScoreRankingTable from './score-ranking-table.svelte';
import type { RankingRow } from '$lib/data/ranking-types.js';

function row(
	slug: string,
	composite: number | null,
	overrides: Partial<RankingRow> = {}
): RankingRow {
	return {
		slug,
		displayName: slug.charAt(0).toUpperCase() + slug.slice(1),
		bezirkSlug: 'mitte',
		bezirkName: 'Mitte',
		composite,
		ruheLuft: 30,
		gruenHitze: 40,
		mobilitaet: 50,
		versorgung: 60,
		wohnschutz: 55,
		kultur: 45,
		kriminalitaet: 70,
		...overrides
	};
}

const kieze: RankingRow[] = [
	row('alpha', 80),
	row('bravo', 50),
	row('charlie', 30),
	row('delta', null)
];

const bezirke: RankingRow[] = [
	row('mitte', 70, { bezirkSlug: null, bezirkName: null }),
	row('pankow', 65, { bezirkSlug: null, bezirkName: null })
];

describe('ScoreRankingTable.svelte', () => {
	it('rendert Tabelle mit allen 4 Kiezen + Spalten-Header', async () => {
		render(ScoreRankingTable, { kieze, bezirke });
		const table = document.querySelector('[data-testid="ranking-table"]');
		expect(table).not.toBeNull();
		const rows = document.querySelectorAll('[data-testid="ranking-table"] tbody tr');
		expect(rows.length).toBe(4);
		expect(table?.textContent).toMatch(/Kiez/);
		expect(table?.textContent).toMatch(/Bezirk/);
		expect(table?.textContent).toMatch(/Score/);
		expect(table?.textContent).toMatch(/Wohnschutz/);
	});

	it('Story 14.9: Kriminalitäts-Spalte ist Kontext, NICHT sortierbar, mit Disclaimer', async () => {
		render(ScoreRankingTable, { kieze, bezirke });
		// Spalte + Zellen vorhanden
		expect(document.querySelector('[data-testid="ranking-col-kriminalitaet"]')).not.toBeNull();
		expect(document.querySelector('[data-testid="ranking-cell-kriminalitaet"]')).not.toBeNull();
		// KEIN Sortier-Button (kein Sicherheits-Leaderboard, 14.5)
		expect(document.querySelector('[data-testid="ranking-sort-kriminalitaet"]')).toBeNull();
		// Disclaimer-Note
		const note = document.querySelector('[data-testid="ranking-kriminalitaet-note"]');
		expect(note).not.toBeNull();
		expect(note?.textContent).toMatch(/Sicherheits-Ranking/i);
	});

	it('default-sortiert Kieze nach composite desc (Alpha vor Bravo vor Charlie)', async () => {
		render(ScoreRankingTable, { kieze, bezirke });
		const rows = document.querySelectorAll('[data-testid="ranking-table"] tbody tr');
		const names = Array.from(rows).map(
			(r) => r.querySelector('th[scope="row"] a')?.textContent?.trim() ?? ''
		);
		expect(names).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta']);
	});

	it('rendert null-Score als en-dash am Listen-Ende', async () => {
		render(ScoreRankingTable, { kieze, bezirke });
		const rows = document.querySelectorAll('[data-testid="ranking-table"] tbody tr');
		const lastRowText = rows[rows.length - 1].textContent ?? '';
		expect(lastRowText).toContain('Delta');
		expect(lastRowText).toContain('–');
	});

	it('View-Toggle Buttons mit Counts sichtbar', async () => {
		render(ScoreRankingTable, { kieze, bezirke });
		const kiezeBtn = document.querySelector('[data-testid="ranking-view-kieze"]');
		const bezirkeBtn = document.querySelector('[data-testid="ranking-view-bezirke"]');
		expect(kiezeBtn?.textContent).toMatch(/4 Kieze/);
		expect(bezirkeBtn?.textContent).toMatch(/2 Bezirke/);
		expect(kiezeBtn?.getAttribute('aria-checked')).toBe('true');
		expect(bezirkeBtn?.getAttribute('aria-checked')).toBe('false');
	});

	it('kein Soziale-Lage-Disclaimer mehr (ADR-015: keine Sozial-Score-Dimension)', async () => {
		render(ScoreRankingTable, { kieze, bezirke });
		expect(document.querySelector('[data-testid="ranking-soziale-disclaimer"]')).toBeNull();
	});

	it('Sortier-Button für jede Spalte vorhanden inkl. Wohnschutz', async () => {
		render(ScoreRankingTable, { kieze, bezirke });
		expect(document.querySelector('[data-testid="ranking-sort-composite"]')).not.toBeNull();
		expect(document.querySelector('[data-testid="ranking-sort-wohnschutz"]')).not.toBeNull();
		expect(document.querySelector('[data-testid="ranking-sort-versorgung"]')).not.toBeNull();
	});

	it('niemals em-dash (memory feedback_no_em_dashes)', async () => {
		render(ScoreRankingTable, { kieze, bezirke });
		const table = document.querySelector('[data-testid="ranking-table"]');
		expect(table?.textContent).not.toMatch(/—/);
	});

	it('niemals "lebenswert" (memory feedback_no_lebenswert)', async () => {
		render(ScoreRankingTable, { kieze, bezirke });
		const section = document.querySelector('[data-testid="score-ranking"]');
		expect(section?.textContent?.toLowerCase()).not.toContain('lebenswert');
	});
});
