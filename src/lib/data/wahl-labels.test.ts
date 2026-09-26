import { describe, it, expect } from 'vitest';
import {
	wahlTypLabel,
	wahlReiheLabel,
	wahlStimmtypLabel,
	wahlEbeneLabel,
	wahlWiederholungLabel,
	wahlVorlaeufigLabel,
	sourceDisplayLabel,
	licenseDisplayLabel
} from './wahl-labels.js';

describe('wahlTypLabel', () => {
	it('liefert DE-Volltexte mit "-wahl"-Suffix', () => {
		expect(wahlTypLabel('btw', { locale: 'de' })).toBe('Bundestagswahl');
		expect(wahlTypLabel('agh', { locale: 'de' })).toBe('Abgeordnetenhauswahl');
		expect(wahlTypLabel('bvv', { locale: 'de' })).toBe('BVV-Wahl');
	});

	it('liefert EN-Volltexte mit Glossar-Klammer-Gloss fuer AGH/BVV', () => {
		expect(wahlTypLabel('btw', { locale: 'en' })).toBe('Bundestag election');
		expect(wahlTypLabel('agh', { locale: 'en' })).toBe(
			'Berlin House of Representatives (Abgeordnetenhaus) election'
		);
		expect(wahlTypLabel('bvv', { locale: 'en' })).toBe('District Assembly (BVV) election');
	});
});

describe('wahlReiheLabel', () => {
	it('liefert kurze DE-Institutionsnamen ohne "-wahl"-Suffix', () => {
		expect(wahlReiheLabel('agh', { locale: 'de' })).toBe('Abgeordnetenhaus');
	});

	it('liefert die kurze EN-Form fuer AGH (kein Volltext-Gloss auf Tabs)', () => {
		expect(wahlReiheLabel('agh', { locale: 'en' })).toBe('House of Representatives');
		expect(wahlReiheLabel('btw', { locale: 'en' })).toBe('Bundestag');
		expect(wahlReiheLabel('bvv', { locale: 'en' })).toBe('District Assembly (BVV)');
	});
});

describe('wahlStimmtypLabel', () => {
	it('uebersetzt Zweitstimme/Erststimme laut Glossar', () => {
		expect(wahlStimmtypLabel('zweitstimme', { locale: 'en' })).toBe('party vote');
		expect(wahlStimmtypLabel('erststimme', { locale: 'en' })).toBe('constituency vote');
		expect(wahlStimmtypLabel('einstimme', { locale: 'en' })).toBe('vote');
	});
});

describe('wahlEbeneLabel', () => {
	it('laesst Kiez/Bezirk in EN unuebersetzt (Matze-Entscheidung 26.09.)', () => {
		expect(wahlEbeneLabel('kiez', { locale: 'en' })).toBe('Kiez');
		expect(wahlEbeneLabel('bezirk', { locale: 'en' })).toBe('Bezirk');
	});

	it('uebersetzt Stimmbezirk', () => {
		expect(wahlEbeneLabel('stimmbezirk', { locale: 'de' })).toBe('Stimmbezirk');
		// Konsistent zu gruppenAnzeigeName() (Review-Fund Matze 26.09.):
		// „Polling district" statt „voting district".
		expect(wahlEbeneLabel('stimmbezirk', { locale: 'en' })).toBe('Polling district');
	});
});

describe('wahlWiederholungLabel / wahlVorlaeufigLabel', () => {
	it('uebersetzt laut Glossar', () => {
		expect(wahlWiederholungLabel({ locale: 'en' })).toBe('repeat election');
		expect(wahlVorlaeufigLabel({ locale: 'en' })).toBe('Provisional');
		expect(wahlVorlaeufigLabel({ locale: 'de' })).toBe('Vorläufig');
	});
});

describe('sourceDisplayLabel', () => {
	it('mappt die drei bekannten Quellen mit Behoerden-Klammer-Gloss in EN', () => {
		expect(sourceDisplayLabel('Bundeswahlleiterin', { locale: 'en' })).toBe(
			'Federal Election Commissioner (Bundeswahlleiterin)'
		);
		expect(sourceDisplayLabel('Landeswahlleiterin Berlin', { locale: 'en' })).toBe(
			'Berlin State Election Commissioner (Landeswahlleiterin Berlin)'
		);
		expect(sourceDisplayLabel('Amt für Statistik Berlin-Brandenburg', { locale: 'en' })).toBe(
			'Statistics Office Berlin-Brandenburg (Amt für Statistik Berlin-Brandenburg)'
		);
	});

	it('DE bleibt unveraendert (Zeichen-fuer-Zeichen-Parity)', () => {
		expect(sourceDisplayLabel('Bundeswahlleiterin', { locale: 'de' })).toBe('Bundeswahlleiterin');
	});

	it('faellt bei null/undefined/leer auf die "unbekannte Quelle"-Message zurueck', () => {
		expect(sourceDisplayLabel(null, { locale: 'de' })).toBe('unbekannte Quelle');
		expect(sourceDisplayLabel(undefined, { locale: 'en' })).toBe('unknown source');
		expect(sourceDisplayLabel('', { locale: 'en' })).toBe('unknown source');
	});

	// Review-Fund: ein echter, nur nicht im Glossar gefuehrter Quellenname
	// (z. B. eine neue Behoerde) wurde vorher faelschlich zu "unbekannte
	// Quelle"/"unknown source" -- muss unveraendert durchgereicht werden.
	it('gibt einen unbekannten, aber nicht-leeren Quellennamen unveraendert zurueck (keine DE-Regression)', () => {
		expect(sourceDisplayLabel('Eine neue Behörde', { locale: 'de' })).toBe('Eine neue Behörde');
		expect(sourceDisplayLabel('Eine neue Behörde', { locale: 'en' })).toBe('Eine neue Behörde');
	});
});

describe('licenseDisplayLabel', () => {
	it('mappt bekannte dl-de/by-Codes (beide Schreibvarianten) auf den ausgeschriebenen Namen', () => {
		expect(licenseDisplayLabel('dl-de/by-2-0', { locale: 'de' })).toBe(
			'Datenlizenz Deutschland Namensnennung 2.0'
		);
		expect(licenseDisplayLabel('dl-de/by-2.0', { locale: 'de' })).toBe(
			'Datenlizenz Deutschland Namensnennung 2.0'
		);
		expect(licenseDisplayLabel('dl-de/by-2-0', { locale: 'en' })).toBe(
			'Data licence Germany, attribution, version 2.0'
		);
	});

	it('gibt einen unbekannten Lizenz-Code unveraendert zurueck (kein Datenverlust)', () => {
		expect(licenseDisplayLabel('cc-by-4.0', { locale: 'en' })).toBe('cc-by-4.0');
	});
});
