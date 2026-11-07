import { describe, expect, it } from 'vitest';
import { splitHeading, splitSections } from './split-sections.js';

describe('splitSections', () => {
	it('teilt am Marker in Abschnitte mit ID, Text davor ohne ID', () => {
		expect(
			splitSections(
				'Lead.\n\n<!-- abschnitt: s1 -->\n\n## Eins\n\nText.\n<!-- abschnitt: quellen -->\nQ.'
			)
		).toEqual([
			{ id: null, markdown: 'Lead.' },
			{ id: 's1', markdown: '## Eins\n\nText.' },
			{ id: 'quellen', markdown: 'Q.' }
		]);
	});

	it('ohne Marker ist der ganze Text ein Abschnitt ohne ID', () => {
		expect(splitSections('Nur Text.')).toEqual([{ id: null, markdown: 'Nur Text.' }]);
	});

	it('lässt einen leeren Anfang weg und toleriert Leerzeichen im Marker', () => {
		expect(splitSections('<!--abschnitt:s2-->\nA\n  <!--  abschnitt:  s3  -->  \nB')).toEqual([
			{ id: 's2', markdown: 'A' },
			{ id: 's3', markdown: 'B' }
		]);
	});

	it('erkennt Marker nur auf eigener Zeile', () => {
		const body = 'Text mit <!-- abschnitt: s1 --> mittendrin.';
		expect(splitSections(body)).toEqual([{ id: null, markdown: body }]);
	});

	it('wirft bei doppelter ID, damit Anker eindeutig bleiben', () => {
		expect(() => splitSections('<!-- abschnitt: s1 -->\nA\n<!-- abschnitt: s1 -->\nB')).toThrow(
			/s1/
		);
	});
});

describe('splitHeading', () => {
	it('trennt eine führende H2 vom Rest', () => {
		expect(splitHeading('## Die Schwelle\n\nText.')).toEqual({
			heading: 'Die Schwelle',
			rest: 'Text.'
		});
	});

	it('ohne führende H2 bleibt der Text ganz', () => {
		expect(splitHeading('Text.\n\n## Später')).toEqual({ heading: null, rest: 'Text.\n\n## Später' });
		expect(splitHeading('### Klein\nText.')).toEqual({ heading: null, rest: '### Klein\nText.' });
	});
});
