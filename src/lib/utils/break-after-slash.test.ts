import { describe, expect, it } from 'vitest';
import { breakAfterSlash } from './break-after-slash';

describe('breakAfterSlash', () => {
	it('teilt nach jedem Schrägstrich und behält ihn im Teil davor', () => {
		expect(breakAfterSlash('Otto-Suhr-Allee/Kantstraße')).toEqual([
			'Otto-Suhr-Allee/',
			'Kantstraße'
		]);
	});

	it('teilt mehrere Schrägstriche', () => {
		expect(breakAfterSlash('Schönholz/Wilhelmsruh/Rosenthal')).toEqual([
			'Schönholz/',
			'Wilhelmsruh/',
			'Rosenthal'
		]);
	});

	it('lässt Namen ohne Schrägstrich ganz', () => {
		expect(breakAfterSlash('Adlershof')).toEqual(['Adlershof']);
	});

	it('liefert für einen leeren Namen ein leeres Array', () => {
		expect(breakAfterSlash('')).toEqual([]);
	});

	it('erzeugt keinen leeren Teil bei Schrägstrich am Ende', () => {
		expect(breakAfterSlash('A/')).toEqual(['A/']);
	});
});
