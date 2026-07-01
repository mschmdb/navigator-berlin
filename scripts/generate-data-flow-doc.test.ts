import { describe, expect, it } from 'vitest';
import { buildRowsFromSources, renderDataFlowMarkdown } from './generate-data-flow-doc.js';
import type { SourceConfig } from './lib/types.js';

const fixture: SourceConfig[] = [
	{
		slug: 'bezirke',
		kind: 'odis',
		sourceUrl: 'https://daten.odis-berlin.de/de/dataset/bezirksgrenzen/data.geojson',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'A: Boundaries',
		sourceUpdatedAt: '2024-01-01T00:00:00.000Z'
	} as SourceConfig,
	{
		slug: 'laerm-2023',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/u_laerm_2023',
		license: 'dl-de/by-2-0',
		bundleGroup: 'B: Lärm',
		sourceUpdatedAt: '2024-06-15T00:00:00.000Z'
	} as SourceConfig
];

describe('buildRowsFromSources', () => {
	it('mapt SourceConfig auf DataFlowRow', () => {
		const rows = buildRowsFromSources(fixture);
		expect(rows).toHaveLength(2);
		expect(rows[0].slug).toBe('bezirke');
		expect(rows[0].bundle).toBe('A: Boundaries');
		expect(rows[0].kind).toBe('odis');
		expect(rows[0].license).toBe('dl-de/zero-2-0');
		expect(rows[0].stand).toBe('2024-01-01');
	});

	it('shortenUrl extrahiert host + pfad', () => {
		const rows = buildRowsFromSources(fixture);
		expect(rows[0].source).toContain('daten.odis-berlin.de');
		expect(rows[1].source).toContain('gdi.berlin.de');
	});

	it('Stand-Fallback bei fehlendem ISO', () => {
		const noStand: SourceConfig[] = [
			{
				slug: 'foo',
				kind: 'odis',
				sourceUrl: 'https://x.de',
				license: 'CC0',
				bundleGroup: 'X',
				sourceUpdatedAt: undefined as unknown as string
			} as SourceConfig
		];
		const rows = buildRowsFromSources(noStand);
		expect(rows[0].stand).toBe('—');
	});
});

describe('renderDataFlowMarkdown', () => {
	it('rendert Frontmatter mit type/audience/last-verified', () => {
		const md = renderDataFlowMarkdown(buildRowsFromSources(fixture), '2026-05-17');
		expect(md).toContain('type: pipeline');
		expect(md).toContain('audience: both');
		expect(md).toContain('last-verified: 2026-05-17');
	});

	it('rendert Tabellen pro Bundle, sortiert', () => {
		const md = renderDataFlowMarkdown(buildRowsFromSources(fixture), '2026-05-17');
		expect(md).toContain('### A: Boundaries');
		expect(md).toContain('### B: Lärm');
		const idxA = md.indexOf('### A: Boundaries');
		const idxB = md.indexOf('### B: Lärm');
		expect(idxA).toBeLessThan(idxB);
	});

	it('jede Row erscheint als Markdown-Tabellen-Zeile', () => {
		const md = renderDataFlowMarkdown(buildRowsFromSources(fixture), '2026-05-17');
		expect(md).toContain('| `bezirke` |');
		expect(md).toContain('| `laerm-2023` |');
	});

	it('Header zeigt Layer-Count', () => {
		const md = renderDataFlowMarkdown(buildRowsFromSources(fixture), '2026-05-17');
		expect(md).toContain('**2 Layer total**');
	});
});

describe('buildStep (Story 15.7)', () => {
	const withBuild: SourceConfig[] = [
		{
			slug: 'kuehle-orte',
			kind: 'local',
			sourceUrl: 'https://www.openstreetmap.org/copyright',
			license: 'ODbL 1.0',
			bundleGroup: 'C: Umwelt',
			buildStep: 'scripts/build-kuehle-orte.ts'
		} as SourceConfig,
		{
			slug: 'bezirke',
			kind: 'odis',
			sourceUrl: 'https://x.de',
			license: 'CC0',
			bundleGroup: 'A: Boundaries'
		} as SourceConfig
	];

	it('mappt buildStep auf die Row, fehlend = "-"', () => {
		const rows = buildRowsFromSources(withBuild);
		expect(rows[0].buildStep).toBe('scripts/build-kuehle-orte.ts');
		expect(rows[1].buildStep).toBe('-');
	});

	it('rendert die Build-Schritt-Spalte mit dem Script-Pfad', () => {
		const md = renderDataFlowMarkdown(buildRowsFromSources(withBuild), '2026-06-30');
		expect(md).toContain('Build-Schritt');
		expect(md).toContain('`scripts/build-kuehle-orte.ts`');
	});
});
