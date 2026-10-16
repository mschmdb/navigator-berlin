import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateEnrichmentSet } from './enrichment.js';
import type { WaermeEnrichment } from './types.js';

describe('committete Wärme-Orte-Daten', () => {
	it('enrichment.json besteht die Validierung ohne Fehler', () => {
		const items = JSON.parse(
			readFileSync('static/data/waerme-orte/enrichment.json', 'utf-8')
		) as WaermeEnrichment[];
		expect(validateEnrichmentSet(items)).toEqual([]);
	});
});
