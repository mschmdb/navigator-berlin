import { describe, expect, it } from 'vitest';
import { KUEHLE_ORTE_QUELLEN, KUEHLE_ORTE_HALTUNG } from './transparenz-content.js';

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
