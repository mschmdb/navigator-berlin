import { describe, expect, it } from 'vitest';
import {
	analyzeMeta,
	evaluateThresholds,
	extractLocs,
	extractMeta,
	localeOfUrl,
	rewriteOrigin,
	type PageMeta
} from './measure-meta.js';

function page(url: string, title: string, description: string): PageMeta {
	return { url, title, description };
}

const DESC_OK = 'x'.repeat(100);

describe('extractLocs', () => {
	it('liest alle loc-Einträge', () => {
		const xml = `<urlset><url><loc>https://navigator.berlin/a</loc></url>
		<url><loc> https://navigator.berlin/b </loc></url></urlset>`;
		expect(extractLocs(xml)).toEqual(['https://navigator.berlin/a', 'https://navigator.berlin/b']);
	});

	it('entschlüsselt XML-Entities', () => {
		expect(extractLocs('<loc>https://navigator.berlin/x?a=1&amp;b=2</loc>')).toEqual([
			'https://navigator.berlin/x?a=1&b=2'
		]);
	});
});

describe('rewriteOrigin', () => {
	it('ersetzt den Origin und behält Pfad und Query', () => {
		expect(rewriteOrigin('https://navigator.berlin/en/layer/x?a=1', 'http://localhost:4173')).toBe(
			'http://localhost:4173/en/layer/x?a=1'
		);
	});

	it('toleriert einen Slash am Ende der Basis-URL', () => {
		expect(rewriteOrigin('https://navigator.berlin/a', 'http://localhost:4173/')).toBe(
			'http://localhost:4173/a'
		);
	});
});

describe('localeOfUrl', () => {
	it('erkennt EN am Pfadpräfix', () => {
		expect(localeOfUrl('http://localhost:4173/en/layer/x')).toBe('en');
		expect(localeOfUrl('http://localhost:4173/en')).toBe('en');
		expect(localeOfUrl('http://localhost:4173/layer/x')).toBe('de');
		expect(localeOfUrl('http://localhost:4173/entwicklung')).toBe('de');
	});
});

describe('extractMeta', () => {
	it('liest Titel und Beschreibung mit Entities', () => {
		const html = `<html><head><title>Lärm &amp; Luft | navigator.berlin</title>
		<meta name="description" content="Zeile &quot;eins&quot; &amp; zwei"></head></html>`;
		expect(extractMeta(html)).toEqual({
			title: 'Lärm & Luft | navigator.berlin',
			description: 'Zeile "eins" & zwei'
		});
	});

	it('liefert leere Strings, wenn Tags fehlen', () => {
		expect(extractMeta('<html></html>')).toEqual({ title: '', description: '' });
	});

	it('findet die Beschreibung auch bei vertauschter Attributreihenfolge', () => {
		const html = '<meta content="Text" name="description"><title>T</title>';
		expect(extractMeta(html)).toEqual({ title: 'T', description: 'Text' });
	});
});

describe('analyzeMeta', () => {
	it('zählt Titel über 60 Zeichen', () => {
		const pages = [
			page('https://x/a', 'a'.repeat(60), DESC_OK),
			page('https://x/b', 'b'.repeat(61), DESC_OK + '1')
		];
		const r = analyzeMeta(pages);
		expect(r.total).toBe(2);
		expect(r.titlesOver60).toBe(1);
		expect(r.titlesOver60Share).toBeCloseTo(0.5);
	});

	it('zählt Beschreibungen unter 70 und über 160 Zeichen', () => {
		const pages = [
			page('https://x/a', 'A', 'k'.repeat(69)),
			page('https://x/b', 'B', 'k'.repeat(69) + 'b'),
			page('https://x/c', 'C', 'k'.repeat(159) + 'c'),
			page('https://x/d', 'D', 'k'.repeat(160) + 'd'),
			page('https://x/e', 'E', '')
		];
		const r = analyzeMeta(pages);
		expect(r.descriptionsUnder70).toBe(2);
		expect(r.descriptionsOver160).toBe(1);
	});

	it('findet doppelte Beschreibungen und Titel je Sprache', () => {
		const pages = [
			page('https://x/a', 'Gleich', DESC_OK),
			page('https://x/b', 'Gleich', DESC_OK),
			page('https://x/c', 'Einzeln', DESC_OK + 'c'),
			page('https://x/en/a', 'Gleich', DESC_OK)
		];
		const r = analyzeMeta(pages);
		expect(r.duplicateDescriptions).toEqual([
			{ locale: 'de', text: DESC_OK, urls: ['https://x/a', 'https://x/b'] }
		]);
		expect(r.duplicateTitles).toEqual([
			{ locale: 'de', text: 'Gleich', urls: ['https://x/a', 'https://x/b'] }
		]);
	});

	it('ignoriert leere Beschreibungen bei den Duplikaten', () => {
		const pages = [page('https://x/a', 'A', ''), page('https://x/b', 'B', '')];
		expect(analyzeMeta(pages).duplicateDescriptions).toEqual([]);
	});

	it('prüft Layer-Beschreibungen unter 70 Zeichen separat', () => {
		const pages = [
			page('https://x/layer/kino', 'Kino', 'Kino'),
			page('https://x/en/layer/kino', 'Kino', 'Cinema'),
			page('https://x/layer/ok', 'Ok', DESC_OK),
			page('https://x/other', 'Andere', 'kurz')
		];
		const r = analyzeMeta(pages);
		expect(r.layerDescriptionsUnder70).toEqual(['https://x/layer/kino', 'https://x/en/layer/kino']);
	});
});

describe('analyzeMeta nicht abrufbar', () => {
	it('zählt fehlgeschlagene Seiten separat und nimmt sie aus den Längenwerten', () => {
		const pages: PageMeta[] = [
			page('https://x/a', 'A', DESC_OK),
			{ url: 'https://x/layer/b', title: '', description: '', error: '500 https://x/layer/b' }
		];
		const r = analyzeMeta(pages);
		expect(r.total).toBe(2);
		expect(r.unreachable).toEqual(['https://x/layer/b']);
		expect(r.descriptionsUnder70).toBe(0);
		expect(r.layerDescriptionsUnder70).toEqual([]);
	});
});

describe('evaluateThresholds', () => {
	const good = analyzeMeta([
		page('https://x/a', 'A', DESC_OK),
		page('https://x/b', 'B', DESC_OK + '1')
	]);

	it('besteht bei sauberen Werten', () => {
		expect(evaluateThresholds(good)).toEqual({ ok: true, violations: [] });
	});

	it('verletzt bei mehr als 10 % langen Titeln', () => {
		const pages = Array.from({ length: 10 }, (_, i) =>
			page(`https://x/${i}`, i < 2 ? 'a'.repeat(61) : 'ok', DESC_OK + i)
		);
		const result = evaluateThresholds(analyzeMeta(pages));
		expect(result.ok).toBe(false);
		expect(result.violations[0]).toContain('Titel > 60');
	});

	it('erlaubt genau 10 % lange Titel', () => {
		const pages = Array.from({ length: 10 }, (_, i) =>
			page(`https://x/${i}`, i < 1 ? 'a'.repeat(61) : 'ok', DESC_OK + i)
		);
		expect(evaluateThresholds(analyzeMeta(pages)).ok).toBe(true);
	});

	it('verletzt bei kurzer Layer-Beschreibung, Duplikat oder nicht abrufbarer Seite', () => {
		const short = analyzeMeta([page('https://x/layer/k', 'K', 'kurz')]);
		expect(evaluateThresholds(short).violations.join()).toContain('Layer-Beschreibungen');
		const dup = analyzeMeta([page('https://x/a', 'A', DESC_OK), page('https://x/b', 'B', DESC_OK)]);
		expect(evaluateThresholds(dup).violations.join()).toContain('Doppelte Beschreibungen');
		const down = analyzeMeta([{ url: 'https://x/a', title: '', description: '', error: '404' }]);
		expect(evaluateThresholds(down).violations.join()).toContain('Nicht abrufbar');
	});
});
