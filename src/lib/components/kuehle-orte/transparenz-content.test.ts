import { afterEach, describe, expect, it } from 'vitest';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { getKuehleOrteQuellen, getKuehleOrteHaltung } from './transparenz-content.js';

const KUEHLE_ORTE_QUELLEN = getKuehleOrteQuellen();
const KUEHLE_ORTE_HALTUNG = getKuehleOrteHaltung();

const ABSOLUTISMEN = ['einzige', 'vollständig', 'garantiert', 'beste', 'besser als die stadt'];

describe('transparenz-content (Story 16.4)', () => {
	it('nennt die drei Quellen-Stränge OSM, Anreicherung, DWD', () => {
		const namen = KUEHLE_ORTE_QUELLEN.map((q) => q.name.toLowerCase()).join(' | ');
		expect(namen).toContain('openstreetmap');
		expect(namen).toContain('anreicherung');
		expect(namen).toContain('wetterdienst');
	});

	it('OSM-Strang trägt Lizenz ODbL 1.0 und Namensnennung', () => {
		const osm = KUEHLE_ORTE_QUELLEN.find((q) => q.name.toLowerCase().includes('openstreetmap'));
		expect(osm?.lizenz).toBe('ODbL 1.0');
		expect(osm?.detail).toContain('OpenStreetMap-Contributors');
	});

	it('Haltungs-Text grenzt sich ab (kein Behörden-Ersatz, lebt von Korrekturen)', () => {
		const text = KUEHLE_ORTE_HALTUNG.toLowerCase();
		expect(text).toContain('ersetzt sie nicht');
		expect(text).toContain('korrekturen');
	});

	it('kein em-dash, kein Absolutismus in Content-Strings', () => {
		const all = [KUEHLE_ORTE_HALTUNG, ...KUEHLE_ORTE_QUELLEN.flatMap((q) => [q.name, q.detail])]
			.join(' ')
			.toLowerCase();
		expect(all).not.toContain('—');
		for (const token of ABSOLUTISMEN) expect(all).not.toContain(token);
	});
});

describe('transparenz-content · EN (i18n C4c)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	it('liefert englische Namen, Details und Haltung, Kennungen unverändert', () => {
		overwriteGetLocale(() => 'en');
		const quellen = getKuehleOrteQuellen();
		expect(quellen.map((q) => q.name)).toEqual([
			'OpenStreetMap',
			'Editorial enrichment',
			'German Weather Service (DWD)'
		]);
		expect(quellen[0]?.lizenz).toBe('ODbL 1.0');
		expect(quellen[0]?.detail).toContain('OpenStreetMap contributors');
		expect(getKuehleOrteHaltung()).toContain('does not replace them');
	});
});

describe('transparenz-content · DE-Wortlaut (i18n C4c)', () => {
	it('behält den Baseline-Wortlaut', () => {
		expect(KUEHLE_ORTE_QUELLEN.map((q) => q.name)).toEqual([
			'OpenStreetMap',
			'Redaktionelle Anreicherung',
			'Deutscher Wetterdienst'
		]);
		expect(KUEHLE_ORTE_QUELLEN[0]?.detail).toBe(
			'Geometrie und Basis-Angaben der Orte, © OpenStreetMap-Contributors. Weitergabe unter denselben Bedingungen (Share-Alike).'
		);
		expect(KUEHLE_ORTE_HALTUNG).toBe(
			'Der Hitze-Navigator sammelt öffentlich zugängliche kühle Orte und prüft sie redaktionell. Er ergänzt die Angebote der Stadt, er ersetzt sie nicht. Die Liste kann Lücken haben und lebt von Korrekturen. Kein Rechtsanspruch auf Zugang: private Orte wie Malls und Kinos üben Hausrecht aus.'
		);
	});
});
