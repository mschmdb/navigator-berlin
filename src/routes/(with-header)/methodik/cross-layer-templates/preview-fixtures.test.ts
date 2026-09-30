import { describe, it, expect } from 'vitest';
import {
	buildBezirkFixture,
	buildKiezFixture,
	previewTagLabel,
	previewSources
} from './preview-fixtures.js';

describe('preview-fixtures', () => {
	it('DE-Kiez-Fixture entspricht den bisherigen Literalen', () => {
		expect(buildKiezFixture('de')).toEqual({
			contextLabel: 'Kiez Friedrichshain Nord',
			context: {
				kiez_name: 'Friedrichshain Nord',
				wahl_typ_label: 'Bundestagswahlen',
				stimmtyp_label: 'Zweitstimmen',
				sparkline_jahre: '2013, 2017, 2021, 2025',
				sparkline_jahre_top_parteien: 'Die Linke (2013), GRÜNE (2017), GRÜNE (2021), GRÜNE (2025)'
			}
		});
	});

	it('DE-Bezirk-Fixture entspricht den bisherigen Literalen', () => {
		expect(buildBezirkFixture('de')).toEqual({
			contextLabel: 'Bezirk Pankow',
			context: {
				bezirk_name: 'Pankow',
				wahl_typ_label: 'Abgeordnetenhauswahl',
				wahl_jahr: 2023,
				top_partei_label: 'CDU',
				top_anteil_pct: '23,1 %',
				zweite_partei_label: 'Bündnis 90/Die Grünen',
				zweite_anteil_pct: '21,4 %'
			}
		});
	});

	it('EN-Fixtures nutzen englische Labels und Zahlenformat', () => {
		const kiez = buildKiezFixture('en');
		expect(kiez.context.wahl_typ_label).toBe('Bundestag elections');
		expect(kiez.context.stimmtyp_label).toBe('party votes');
		const bezirk = buildBezirkFixture('en');
		expect(bezirk.context.wahl_typ_label).toBe(
			'Berlin House of Representatives (Abgeordnetenhaus) election'
		);
		expect(bezirk.context.top_anteil_pct).toBe('23.1%');
		expect(bezirk.context.zweite_anteil_pct).toBe('21.4%');
	});

	it('Tag-Labels folgen der Locale, unbekannte Tags bleiben unverändert', () => {
		expect(previewTagLabel('wahl', 'de')).toBe('wahl');
		expect(previewTagLabel('wahl', 'en')).toBe('election');
		expect(previewTagLabel('zeitreihe', 'en')).toBe('time series');
		expect(previewTagLabel('trend', 'en')).toBe('trend');
		expect(previewTagLabel('unbekannt', 'en')).toBe('unbekannt');
	});

	it('Quellen-Labels folgen der Locale, Lizenz bleibt gleich', () => {
		expect(previewSources('de')).toEqual([
			{ label: 'Wahlbezirksstatistik', license: 'dl-de/by-2-0' },
			{ label: 'Mietspiegel Wohnlagen 2024', license: 'dl-de/by-2-0' },
			{ label: 'Lärmkartierung 2023', license: 'dl-de/by-2-0' }
		]);
		expect(previewSources('en').map((s) => s.label)).toEqual([
			'Polling district statistics',
			'Rent index residential areas 2024',
			'Noise mapping 2023'
		]);
	});
});
