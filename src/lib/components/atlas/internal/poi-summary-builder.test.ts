import { describe, expect, it } from 'vitest';
import { getPopoverSummary } from './poi-summary-builder.js';

describe('poi-summary-builder.getPopoverSummary', () => {
	describe('stolpersteine (Editorial-Würde, AC-4/8)', () => {
		it('zeigt person-Property als Titel wenn vorhanden', () => {
			expect(getPopoverSummary('stolpersteine', { person: 'Anna Müller' })).toEqual({
				title: 'Anna Müller'
			});
		});

		it('zeigt Layer-Default "Stolperstein" wenn person fehlt — KEIN "Unbekannte Person"', () => {
			const res = getPopoverSummary('stolpersteine', {});
			expect(res.title).toBe('Stolperstein');
			expect(res.subtitle).toBeUndefined();
		});

		it('zeigt "Stolperstein" wenn person empty-string ist', () => {
			expect(getPopoverSummary('stolpersteine', { person: '' }).title).toBe('Stolperstein');
		});

		it('zeigt "Stolperstein" wenn properties null sind', () => {
			expect(getPopoverSummary('stolpersteine', null).title).toBe('Stolperstein');
		});
	});

	describe('trinkbrunnen', () => {
		it('zeigt name wenn vorhanden', () => {
			expect(getPopoverSummary('trinkbrunnen', { name: 'BWB Brunnen 42' }).title).toBe(
				'BWB Brunnen 42'
			);
		});

		it('fällt auf "Trinkbrunnen" wenn name fehlt', () => {
			expect(getPopoverSummary('trinkbrunnen', {}).title).toBe('Trinkbrunnen');
		});

		it('baut Subtitle aus kostenlos + Flaschen', () => {
			expect(getPopoverSummary('trinkbrunnen', { fee: 'no', bottle: 'yes' }).subtitle).toBe(
				'kostenlos · Flaschen auffüllen'
			);
		});

		it('mappt wheelchair auf Barrierefreiheit', () => {
			expect(getPopoverSummary('trinkbrunnen', { wheelchair: 'yes' }).subtitle).toBe(
				'barrierefrei'
			);
			expect(getPopoverSummary('trinkbrunnen', { wheelchair: 'limited' }).subtitle).toBe(
				'teils barrierefrei'
			);
		});

		it('kappt den Subtitle auf zwei Angaben', () => {
			const sub = getPopoverSummary('trinkbrunnen', {
				fee: 'no',
				bottle: 'yes',
				wheelchair: 'yes'
			}).subtitle;
			expect(sub).toBe('kostenlos · Flaschen auffüllen');
		});

		it('ohne belegte Angaben kein Subtitle', () => {
			expect(getPopoverSummary('trinkbrunnen', { fountain: 'bubbler' }).subtitle).toBeUndefined();
		});
	});

	describe('kitas-2024', () => {
		it('zeigt name', () => {
			expect(getPopoverSummary('kitas-2024', { name: 'Kita Sonnenschein' }).title).toBe(
				'Kita Sonnenschein'
			);
		});

		it('fällt auf Layer-Display-Name wenn name fehlt', () => {
			expect(getPopoverSummary('kitas-2024', {}).title).toBe('Kindertagesstätten');
		});
	});

	describe('schulen-2024', () => {
		it('zeigt name + Schulart als subtitle', () => {
			const res = getPopoverSummary('schulen-2024', {
				name: 'Grundschule am Stadtpark',
				schulart: 'Grundschule'
			});
			expect(res.title).toBe('Grundschule am Stadtpark');
			expect(res.subtitle).toBe('Grundschule');
		});

		it('ohne schulart kein subtitle', () => {
			const res = getPopoverSummary('schulen-2024', { name: 'Test-Schule' });
			expect(res.title).toBe('Test-Schule');
			expect(res.subtitle).toBeUndefined();
		});
	});

	describe('krankenhaeuser', () => {
		it('zeigt name für krankenhaeuser-plan', () => {
			expect(getPopoverSummary('krankenhaeuser-plan', { name: 'Charité Mitte' }).title).toBe(
				'Charité Mitte'
			);
		});

		it('zeigt name für krankenhaeuser-weitere', () => {
			expect(getPopoverSummary('krankenhaeuser-weitere', { name: 'Spezialklinik' }).title).toBe(
				'Spezialklinik'
			);
		});
	});

	describe('sportanlagen-2024', () => {
		it('zeigt name wenn vorhanden', () => {
			expect(
				getPopoverSummary('sportanlagen-2024', { name: 'Stadion Tiergarten', sport: 'Fußball' })
					.title
			).toBe('Stadion Tiergarten');
		});

		it('fällt auf sport-Property wenn name fehlt', () => {
			expect(getPopoverSummary('sportanlagen-2024', { sport: 'Tennis' }).title).toBe('Tennis');
		});
	});

	describe('schwimmbaeder', () => {
		it('zeigt name', () => {
			expect(getPopoverSummary('schwimmbaeder', { name: 'Stadtbad Mitte' }).title).toBe(
				'Stadtbad Mitte'
			);
		});
	});

	describe('Stationen (U/S/Tram/Bus)', () => {
		it('zeigt name für ubahn-stationen', () => {
			expect(getPopoverSummary('ubahn-stationen', { name: 'Alexanderplatz' }).title).toBe(
				'Alexanderplatz'
			);
		});

		it('zeigt name für sbahn-stationen', () => {
			expect(getPopoverSummary('sbahn-stationen', { name: 'Friedrichstraße' }).title).toBe(
				'Friedrichstraße'
			);
		});

		it('zeigt name für tram-haltestellen', () => {
			expect(getPopoverSummary('tram-haltestellen', { name: 'Hackescher Markt' }).title).toBe(
				'Hackescher Markt'
			);
		});

		it('zeigt name für bus-haltestellen', () => {
			expect(getPopoverSummary('bus-haltestellen', { name: 'Hauptbahnhof' }).title).toBe(
				'Hauptbahnhof'
			);
		});

		it('fällt auf Display-Name wenn name fehlt', () => {
			expect(getPopoverSummary('ubahn-stationen', {}).title).toBe('U-Bahn-Stationen');
			expect(getPopoverSummary('bus-haltestellen', {}).title).toBe('Bus-Haltestellen');
		});
	});

	describe('Edge cases', () => {
		it('liefert Display-Name als Fallback für unbekannten POI-Slug', () => {
			expect(getPopoverSummary('unbekannter-layer', {}).title).toBe('unbekannter-layer');
		});

		it('handhabt null properties graceful für alle POI-Slugs', () => {
			expect(getPopoverSummary('trinkbrunnen', null).title).toBe('Trinkbrunnen');
			expect(getPopoverSummary('kitas-2024', null).title).toBe('Kindertagesstätten');
			expect(getPopoverSummary('ubahn-stationen', null).title).toBe('U-Bahn-Stationen');
		});

		it('handhabt non-string name graceful', () => {
			expect(getPopoverSummary('kitas-2024', { name: 42 }).title).toBe('Kindertagesstätten');
		});

		it('trimmt whitespace und behandelt whitespace-only name wie missing', () => {
			expect(getPopoverSummary('kitas-2024', { name: '   ' }).title).toBe('Kindertagesstätten');
		});
	});

	describe('kuehle-orte (Story 15.3 Tooltip-Fix)', () => {
		it('zeigt Ortsnamen als Titel + Kategorie als Untertitel', () => {
			expect(getPopoverSummary('kuehle-orte', { name: 'Max-Liebermann-Haus', cat: 'Museum' })).toEqual({
				title: 'Max-Liebermann-Haus',
				subtitle: 'Museum'
			});
		});
		it('nimmt den Kühle-Score in den Untertitel auf', () => {
			expect(
				getPopoverSummary('kuehle-orte', { name: 'Madame Tussauds', cat: 'Museum', cool_score: 4 })
			).toEqual({ title: 'Madame Tussauds', subtitle: 'Museum · Kühle 4/5' });
		});
		it('faellt auf Layer-Namen zurueck, wenn name fehlt', () => {
			expect(getPopoverSummary('kuehle-orte', { cat: 'Museum' }).title).toBe('Kühle Orte');
		});
	});

});
