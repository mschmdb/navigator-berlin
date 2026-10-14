import { describe, it, expect } from 'vitest';
import { readBezirkComposite, readEinwohnerStichtag } from './meta-sources.js';

describe('meta-sources', () => {
	it('liest den Stichtag als ISO-Datum', async () => {
		expect(await readEinwohnerStichtag()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it('liest den Bezirks-Composite als Zahl', async () => {
		expect(typeof (await readBezirkComposite('reinickendorf'))).toBe('number');
	});

	it('liefert null für unbekannte Bezirke', async () => {
		expect(await readBezirkComposite('gibt-es-nicht')).toBeNull();
	});
});
