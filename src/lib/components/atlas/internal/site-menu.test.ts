import { describe, expect, it } from 'vitest';
import { siteMenuGroups, seasonOrder, isCurrentMenuHref } from './site-menu.js';

describe('seasonOrder', () => {
	it('Oktober bis März: Kälte zuerst', () => {
		for (const month of [9, 10, 11, 0, 1, 2]) {
			expect(seasonOrder(new Date(2026, month, 15))).toEqual(['kaelte', 'hitze']);
		}
	});

	it('April bis September: Hitze zuerst', () => {
		for (const month of [3, 4, 5, 6, 7, 8]) {
			expect(seasonOrder(new Date(2026, month, 15))).toEqual(['hitze', 'kaelte']);
		}
	});
});

describe('siteMenuGroups', () => {
	it('liefert vier Gruppen in fester Reihenfolge', () => {
		const groups = siteMenuGroups(new Date(2026, 9, 17));
		expect(groups.map((g) => g.id)).toEqual(['karte', 'vergleichen', 'saison', 'projekt']);
	});

	it('Karte-Gruppe: Karte und Kiez-Finder mit Ziel-URLs', () => {
		const [karte] = siteMenuGroups(new Date(2026, 9, 17));
		expect(karte.items.map((i) => [i.id, i.href])).toEqual([
			['karte', '/explore'],
			['finder', '/explore?finder=1']
		]);
	});

	it('Vergleichen-Gruppe: Kiez-Score, Wahlen, Kieze und Bezirke', () => {
		const groups = siteMenuGroups(new Date(2026, 9, 17));
		expect(groups[1].items.map((i) => [i.id, i.href])).toEqual([
			['score', '/kiez-score'],
			['wahlen', '/berlin-wahlen'],
			['kieze', '/kieze']
		]);
	});

	it('Saison-Gruppe folgt der Jahreszeit', () => {
		expect(siteMenuGroups(new Date(2026, 0, 10))[2].items.map((i) => i.id)).toEqual([
			'kaelte',
			'hitze'
		]);
		expect(siteMenuGroups(new Date(2026, 6, 10))[2].items.map((i) => i.id)).toEqual([
			'hitze',
			'kaelte'
		]);
	});

	it('Projekt-Gruppe: nur Links ohne Beschreibung', () => {
		const projekt = siteMenuGroups(new Date(2026, 9, 17))[3];
		expect(projekt.items.map((i) => [i.id, i.href])).toEqual([
			['daten', '/daten'],
			['methodik', '/methodik'],
			['updates', '/updates'],
			['ueber', '/ueber']
		]);
		expect(projekt.items.every((i) => !i.described)).toBe(true);
	});

	it('Einträge der ersten drei Gruppen tragen eine Beschreibung', () => {
		const groups = siteMenuGroups(new Date(2026, 9, 17)).slice(0, 3);
		expect(groups.flatMap((g) => g.items).every((i) => i.described)).toBe(true);
	});
});

describe('isCurrentMenuHref', () => {
	it('erkennt die aktuelle Seite inklusive Unterseiten', () => {
		expect(isCurrentMenuHref('/methodik/kiez-score', '/methodik')).toBe(true);
		expect(isCurrentMenuHref('/kiez-score', '/kiez-score')).toBe(true);
		expect(isCurrentMenuHref('/kieze', '/kiez-score')).toBe(false);
	});

	it('Finder-Link ist nie "aktuell", die Karte nur auf /explore', () => {
		expect(isCurrentMenuHref('/explore', '/explore?finder=1')).toBe(false);
		expect(isCurrentMenuHref('/explore', '/explore')).toBe(true);
	});

	it('Startseite markiert keinen Eintrag', () => {
		expect(isCurrentMenuHref('/', '/explore')).toBe(false);
	});
});
