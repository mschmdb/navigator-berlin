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

// Story 7 (Wechsel-Kapitel) + Story 11 (Sankey-Rework): eigene Reihen-Historie
// (2016 SPD -> 2021 GRÜNE -> 2023 Wiederholungswahl GRÜNE), damit genau ein
// Wechsel entsteht (an 2021->2023) UND der Sankey mindestens ein Band
// rendert. Geteilt zwischen `berlin-wahlen.e2e.ts` und `a11y.e2e.ts` (Review
// Triage Log #9: der Axe-Scan braucht ein sichtbares Sankey-Band).
export const WINNERS_WECHSEL_KAPITEL = {
	typ: 'agh',
	stimmtyp: 'zweitstimme',
	ebene: 'kiez',
	winners: [
		{
			jahr: 2016,
			gebiet_slug: 'mv-nord',
			partei: 'SPD',
			farbe_hex: '#A50C1A',
			anteil: 0.4,
			is_repeat_election: false,
			parent_slug: null
		},
		{
			jahr: 2021,
			gebiet_slug: 'mv-nord',
			partei: 'GRÜNE',
			farbe_hex: '#0F6E2C',
			anteil: 0.35,
			is_repeat_election: false,
			parent_slug: null
		},
		{
			jahr: 2023,
			gebiet_slug: 'mv-nord',
			partei: 'GRÜNE',
			farbe_hex: '#0F6E2C',
			anteil: 0.38,
			is_repeat_election: true,
			parent_slug: '2021-agh-zweitstimme'
		}
	],
	license: 'dl-de/by-2.0',
	source_url: 'https://example.invalid/agh23',
	source_name: 'Amt für Statistik Berlin-Brandenburg'
};

// Story 8 (Trends/Sankey): eigene Analytik-Fixture, `mv-nord` deckt sich mit
// `WINNERS_WECHSEL_KAPITEL` oben, damit Geometrie + Analytik dasselbe Gebiet
// treffen.
export const ANALYTIK_AGH_KIEZ = {
	ebene: 'kiez',
	typ: 'agh',
	stimmtyp: 'zweitstimme',
	gebiete: [
		{
			kiez_slug: 'mv-nord',
			wechsel_count: 1,
			wechsel_jahre: [2023],
			volatilitaet: 0.08,
			trends: [{ partei: 'SPD', slope: 0.015 }]
		}
	],
	license: 'dl-de/by-2.0',
	source_url: 'https://example.invalid/agh23',
	source_name: 'Amt für Statistik Berlin-Brandenburg'
};
