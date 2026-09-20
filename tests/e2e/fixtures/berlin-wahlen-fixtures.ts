/**
 * Geteilte E2E-Fixtures für `/berlin-wahlen` (Story 3 Portal-Skeleton +
 * Story 9 Partei-Tabs): aus `berlin-wahlen.e2e.ts` gezogen, damit die neue
 * Partei-Datei (`berlin-wahlen-partei.e2e.ts`, Ordner-Konvention „ein Flow
 * pro Datei") sie nicht dupliziert.
 */
export const ELECTIONS = {
	elections: [
		{
			slug: '2023-agh-erststimme',
			jahr: 2023,
			typ: 'agh',
			stimmtyp: 'erststimme',
			is_repeat_election: true,
			parent_slug: '2021-agh-erststimme',
			has_stimmbezirks_geometry: true,
			source_name: 'Amt für Statistik Berlin-Brandenburg',
			source_url: 'https://example.invalid/agh23',
			license: 'dl-de/by-2.0'
		},
		{
			slug: '2023-agh-zweitstimme',
			jahr: 2023,
			typ: 'agh',
			stimmtyp: 'zweitstimme',
			is_repeat_election: true,
			parent_slug: '2021-agh-zweitstimme',
			has_stimmbezirks_geometry: true,
			source_name: 'Amt für Statistik Berlin-Brandenburg',
			source_url: 'https://example.invalid/agh23',
			license: 'dl-de/by-2.0'
		},
		{
			slug: '2021-agh-zweitstimme',
			jahr: 2021,
			typ: 'agh',
			stimmtyp: 'zweitstimme',
			is_repeat_election: false,
			parent_slug: null,
			has_stimmbezirks_geometry: true,
			source_name: 'Amt für Statistik Berlin-Brandenburg',
			source_url: 'https://example.invalid/agh21',
			license: 'dl-de/by-2.0'
		},
		{
			slug: '2016-agh-zweitstimme',
			jahr: 2016,
			typ: 'agh',
			stimmtyp: 'zweitstimme',
			is_repeat_election: false,
			parent_slug: null,
			has_stimmbezirks_geometry: true,
			source_name: 'Amt für Statistik Berlin-Brandenburg',
			source_url: 'https://example.invalid/agh16',
			license: 'dl-de/by-2.0'
		},
		{
			slug: '2025-btw-zweitstimme',
			jahr: 2025,
			typ: 'btw',
			stimmtyp: 'zweitstimme',
			is_repeat_election: false,
			parent_slug: null,
			has_stimmbezirks_geometry: true,
			source_name: 'Bundeswahlleiterin',
			source_url: 'https://example.invalid/btw25',
			license: 'dl-de/by-2.0'
		}
	]
};
