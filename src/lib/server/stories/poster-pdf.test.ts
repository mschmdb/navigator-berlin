import { describe, expect, it } from 'vitest';
import { loadBezirkeDaten } from '$lib/stories/punkt-linie-kiez/bezirke-daten.server.js';
import { PAGE_HEIGHT_PT, PAGE_WIDTH_PT, renderPosterPdf } from './poster-pdf';

const utf16hex = (s: string): string =>
	Buffer.from('﻿' + s, 'utf16le')
		.swap16()
		.toString('hex');

describe('renderPosterPdf', () => {
	const daten = loadBezirkeDaten();
	const item = daten.bezirke.find((b) => b.slug === 'friedrichshain-kreuzberg')!;

	it('liefert ein PDF im Format 400 x 500 mm', async () => {
		const pdf = await renderPosterPdf(item, daten.sources, 'de');
		expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
		expect(pdf.subarray(-6).toString()).toContain('%%EOF');
		const box = /\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/.exec(pdf.toString('latin1'));
		expect(Number(box![1])).toBeCloseTo(PAGE_WIDTH_PT, 1);
		expect(Number(box![2])).toBeCloseTo(PAGE_HEIGHT_PT, 1);
	});

	it('trägt den Bezirksnamen im Titel des Dokuments', async () => {
		const text = (await renderPosterPdf(item, daten.sources, 'de')).toString('latin1');
		expect(
			text.includes('Friedrichshain-Kreuzberg') ||
				text.toLowerCase().includes(utf16hex('Friedrichshain-Kreuzberg'))
		).toBe(true);
	});

	it('bettet Jost ein und enthält kein Rasterbild', async () => {
		const text = (await renderPosterPdf(item, daten.sources, 'en')).toString('latin1');
		expect(text).toMatch(/\/BaseFont \/[A-Z]{6}\+Jost/);
		expect(text).not.toContain('/Subtype /Image');
	});
});
