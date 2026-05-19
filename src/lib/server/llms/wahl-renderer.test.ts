import { describe, it, expect } from 'vitest';
import {
	buildWahlEntry,
	buildWahlShortDescription,
	renderWahlMarkdown,
	type WahlMarkdownInput
} from './wahl-renderer.js';

const BASE: WahlMarkdownInput = {
	origin: 'https://navigator.berlin',
	slug: '2025-btw-zweitstimme',
	title: 'Bundestagswahl 2025 · Zweitstimme',
	jahr: 2025,
	typ: 'btw',
	stimmtyp: 'zweitstimme',
	isRepeatElection: false,
	sourceName: 'Bundeswahlleiterin',
	license: 'dl-de/by-2-0',
	berlinTop5: [
		{ kurzname: 'Die Linke', vollname: 'Die Linke', stimmen: 301000, anteil: 0.199 },
		{ kurzname: 'CDU', vollname: 'CDU', stimmen: 278000, anteil: 0.183 }
	]
};

describe('buildWahlShortDescription', () => {
	it('BTW Zweitstimme', () => {
		const short = buildWahlShortDescription(BASE);
		expect(short).toContain('Bundestagswahl 2025');
		expect(short).toContain('Zweitstimme');
		expect(short).toContain('Bundeswahlleiterin');
	});

	it('BVV ohne Stimmtyp-Suffix', () => {
		const short = buildWahlShortDescription({
			...BASE,
			jahr: 2023,
			typ: 'bvv',
			stimmtyp: 'einstimme',
			title: 'BVV-Wahl 2023 · Wiederholung',
			isRepeatElection: true
		});
		expect(short).toContain('BVV-Wahl 2023');
		expect(short).not.toContain('Stimme · '); // kein extra-Pipe für BVV
		expect(short).toContain('Wiederholungswahl');
	});
});

describe('renderWahlMarkdown', () => {
	it('enthält URL + Methodik-Verweis', () => {
		const md = renderWahlMarkdown(BASE);
		expect(md).toContain('https://navigator.berlin/wahl/2025-btw-zweitstimme');
		expect(md).toContain('https://navigator.berlin/methodik/wahldaten');
	});

	it('rendert Top-5-Tabelle wenn Daten da', () => {
		const md = renderWahlMarkdown(BASE);
		expect(md).toContain('Berlin gesamt · Top-5-Parteien');
		expect(md).toContain('| Die Linke');
		expect(md).toContain('19,9 %');
		expect(md).toContain('301.000');
	});

	it('rendert ohne Tabelle bei leerer Top-5', () => {
		const md = renderWahlMarkdown({ ...BASE, berlinTop5: [] });
		expect(md).not.toContain('Top-5-Parteien');
	});

	it('Wiederholungswahl-Hinweis bei isRepeatElection=true', () => {
		const md = renderWahlMarkdown({ ...BASE, isRepeatElection: true });
		expect(md).toContain('Wiederholungswahl');
	});

	it('Briefwahl-Caveat immer enthalten', () => {
		const md = renderWahlMarkdown(BASE);
		expect(md).toContain('Brief-Stimmen');
	});
});

describe('buildWahlEntry', () => {
	it('liefert slug + name + short + markdown', () => {
		const e = buildWahlEntry(BASE);
		expect(e.slug).toBe('2025-btw-zweitstimme');
		expect(e.name).toBe('Bundestagswahl 2025 · Zweitstimme');
		expect(e.short).toBeTruthy();
		expect(e.markdown).toContain('## Bundestagswahl 2025');
	});
});
