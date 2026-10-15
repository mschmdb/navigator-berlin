import { describe, expect, it } from 'vitest';
import { loadLayerKiezRanking, loadRankingRegions } from './layer-kiez-ranking-loader.js';
import { readLayerAggregatesFile } from './profile/meta-sources.js';

// Läuft gegen die echten static/-Dateien (cwd = Repo-Root).

describe('loadLayerKiezRanking (echte Daten)', () => {
	it('jeder Eintrag der Bestandsmiete-Rangliste hat einen Bezirksnamen', async () => {
		const r = await loadLayerKiezRanking('zensus-bestandsmiete-2022');
		const entries = [...(r?.top.entries ?? []), ...(r?.bottom?.entries ?? [])];
		expect(entries.length).toBeGreaterThan(0);
		for (const e of entries) {
			expect(e.bezirkName).not.toBe('');
			expect(e.name).not.toBe('');
		}
	});

	it('alle Kiez-Keys der Aggregate sind Regionen, inklusive Dubletten-Slug', async () => {
		const regions = await loadRankingRegions();
		const file = await readLayerAggregatesFile();
		expect(file).not.toBeNull();
		expect(regions.has('heerstrasse-spandau')).toBe(true);
		for (const [layer, entry] of Object.entries(file?.aggregates ?? {})) {
			for (const slug of Object.keys(entry.kiez)) {
				expect(regions.has(slug), `${layer}: ${slug}`).toBe(true);
			}
		}
	});

	it('Score-Rangliste hat 5 Einträge in absteigender Reihenfolge, ohne Flop-Liste', async () => {
		const r = await loadLayerKiezRanking('kiez-score-gesamt');
		expect(r?.top.entries).toHaveLength(5);
		expect(r?.bottom).toBeNull();
		const values = r?.top.entries.map((e) => e.value) ?? [];
		expect(values).toEqual([...values].sort((a, b) => b - a));
	});

	it('Lärm und unbekannter Layer haben keine Rangliste', async () => {
		expect(await loadLayerKiezRanking('laerm-2023')).toBeNull();
		expect(await loadLayerKiezRanking('gibt-es-nicht')).toBeNull();
	});
});
