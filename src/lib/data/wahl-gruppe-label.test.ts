import { describe, it, expect } from 'vitest';
import { briefCodeFromGruppeId, gruppenAnzeigeName } from './wahl-gruppe-label.js';

describe('briefCodeFromGruppeId', () => {
	it('AGH/BVV-Format', () => {
		expect(briefCodeFromGruppeId('09B7P')).toBe('7P');
		expect(briefCodeFromGruppeId('01B1A')).toBe('1A');
	});

	it('BTW 21/25-Format (kein B-Infix im Gruppen-ID-Segment)', () => {
		expect(briefCodeFromGruppeId('075-01-1A-5')).toBe('1A');
		expect(briefCodeFromGruppeId('074-01-1C-5')).toBe('1C');
	});

	it('BTW 17-Format (B-Infix im dritten Segment)', () => {
		expect(briefCodeFromGruppeId('075-01-01B1A-5')).toBe('1A');
	});
});

describe('gruppenAnzeigeName', () => {
	it('AGH/BVV: Zwei-Urnen-Gruppe (Spec-Beispiel, kein doppeltes "und")', () => {
		expect(gruppenAnzeigeName('09B7P', '726,727')).toBe('Stimmbezirke 726, 727 und Briefwahl 7P');
	});

	it('AGH/BVV: Drei-Urnen-Gruppe', () => {
		expect(gruppenAnzeigeName('01B1A', '100,101,102')).toBe(
			'Stimmbezirke 100, 101, 102 und Briefwahl 1A'
		);
	});

	it('AGH/BVV: Ein-Urnen-Gruppe im Singular', () => {
		expect(gruppenAnzeigeName('01B1A', '100')).toBe('Stimmbezirk 100 und Briefwahl 1A');
	});

	it('BTW 21/25: Zwei-Urnen-Gruppe zeigt den echten Brief-Code, nicht die volle Gruppen-ID', () => {
		expect(gruppenAnzeigeName('075-01-1A-5', '726,727')).toBe(
			'Stimmbezirke 726, 727 und Briefwahl 1A'
		);
	});

	it('BTW 17: Ein-Urnen-Gruppe zeigt den echten Brief-Code trotz B-Infix + Bindestrich-Suffix', () => {
		expect(gruppenAnzeigeName('075-01-01B1A-5', '221')).toBe(
			'Stimmbezirk 221 und Briefwahl 1A'
		);
	});

	it('fällt ohne Mitglieder-Liste auf "Gruppe <id>" zurück', () => {
		expect(gruppenAnzeigeName('01B1A', undefined)).toBe('Gruppe 01B1A');
		expect(gruppenAnzeigeName('01B1A', '')).toBe('Gruppe 01B1A');
	});

	// i18n Block B (Review-Fund Matze 26.09.): "Stimmbezirk"/"Briefwahl" sind
	// nicht im Glossar als deutsch-bleibend gelistet, werden also übersetzt.
	// Aufrufer: Winner-Map-Tooltip/-Tabelle (`winner-map-data.ts`), Detail-
	// seiten-Choropleth-Popup (`wahl-stimmbezirk-choropleth.svelte`),
	// Adress-Hinweis (`winner-map-address.svelte.ts` -> `resolveAddressLabel`).
	it('EN: Ein-Urnen-Gruppe -> "Polling district <id> and postal district <code>"', () => {
		expect(gruppenAnzeigeName('01B1A', '100', { locale: 'en' })).toBe(
			'Polling district 100 and postal district 1A'
		);
	});

	it('EN: Zwei-Urnen-Gruppe -> "Polling districts <id>, <id> and postal district <code>"', () => {
		expect(gruppenAnzeigeName('09B7P', '726,727', { locale: 'en' })).toBe(
			'Polling districts 726, 727 and postal district 7P'
		);
	});

	it('EN: Drei-Urnen-Gruppe bleibt im Plural, Codes/Zahlen unverändert', () => {
		expect(gruppenAnzeigeName('01B1A', '100,101,102', { locale: 'en' })).toBe(
			'Polling districts 100, 101, 102 and postal district 1A'
		);
	});

	it('EN: Fallback ohne Mitglieder-Liste -> "Group <id>"', () => {
		expect(gruppenAnzeigeName('01B1A', undefined, { locale: 'en' })).toBe('Group 01B1A');
		expect(gruppenAnzeigeName('01B1A', '', { locale: 'en' })).toBe('Group 01B1A');
	});

	it('DE bleibt ohne explizite locale-Option Zeichen-fuer-Zeichen gleich', () => {
		expect(gruppenAnzeigeName('09B7P', '726,727')).toBe('Stimmbezirke 726, 727 und Briefwahl 7P');
		expect(gruppenAnzeigeName('01B1A', undefined)).toBe('Gruppe 01B1A');
	});
});
