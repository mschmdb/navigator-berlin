import { describe, it, expect } from 'vitest';
import { richSegments } from './rich-text.js';

describe('richSegments', () => {
	it('liefert reinen Text als ein Segment ohne Tag', () => {
		expect(richSegments(() => 'Nur Text.')).toEqual([{ tag: null, text: 'Nur Text.' }]);
	});

	it('zerlegt einen umschlossenen Bereich in Text, Tag, Text', () => {
		const out = richSegments(
			(t) => `Vollständige Methodik: ${t('link').start}Kiez-Score${t('link').end}.`
		);
		expect(out).toEqual([
			{ tag: null, text: 'Vollständige Methodik: ' },
			{ tag: 'link', text: 'Kiez-Score' },
			{ tag: null, text: '.' }
		]);
	});

	it('unterstützt mehrere Tags mit getrennten Namen', () => {
		const out = richSegments(
			(t) => `${t('a').start}Eins${t('a').end} · ${t('b').start}Zwei${t('b').end}`
		);
		expect(out).toEqual([
			{ tag: 'a', text: 'Eins' },
			{ tag: null, text: ' · ' },
			{ tag: 'b', text: 'Zwei' }
		]);
	});

	it('unterstützt denselben Tag mehrfach (drei code-Spans)', () => {
		const out = richSegments(
			(t) => `${t('code').start}x${t('code').end} und ${t('code').start}y${t('code').end}`
		);
		expect(out.filter((s) => s.tag === 'code').map((s) => s.text)).toEqual(['x', 'y']);
	});

	it('gibt einen nicht geschlossenen Tag als Text zurück statt zu werfen', () => {
		const out = richSegments((t) => `Vor ${t('link').start}offen`);
		expect(out.map((s) => s.text).join('')).toBe('Vor offen');
		expect(out.every((s) => s.tag === null)).toBe(true);
	});

	it('lässt Text ohne Marker im Message-Text unverändert (leerer String)', () => {
		expect(richSegments(() => '')).toEqual([]);
	});

	it('ein End-Marker mit falschem Namen schließt das offene Tag nicht', () => {
		const out = richSegments((t) => `${t('a').start}Eins${t('b').end} noch a${t('a').end} Ende`);
		expect(out).toEqual([
			{ tag: 'a', text: 'Eins' },
			{ tag: 'a', text: ' noch a' },
			{ tag: null, text: ' Ende' }
		]);
	});
});
