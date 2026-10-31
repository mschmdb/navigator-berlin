import { describe, expect, it } from 'vitest';
import { splitAtVisual } from './split-at-visual.js';

describe('splitAtVisual', () => {
	it('teilt den Text am Marker in davor und danach', () => {
		expect(splitAtVisual('Intro.\n\n<!-- visual -->\n\nRest.')).toEqual({
			before: 'Intro.',
			after: 'Rest.'
		});
	});

	it('ohne Marker steht der ganze Text nach dem Bild', () => {
		expect(splitAtVisual('Nur Text.')).toEqual({ before: '', after: 'Nur Text.' });
	});

	it('toleriert Leerzeichen im Marker und nutzt nur den ersten', () => {
		expect(splitAtVisual('A\n<!--visual-->\nB\n<!-- visual -->\nC')).toEqual({
			before: 'A',
			after: 'B\n<!-- visual -->\nC'
		});
	});
});
